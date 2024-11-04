import { log } from "console"
import { randomUUID } from "crypto"
import EventEmitter from "events"
import WebSocket from "ws"

const sleep = ms => new Promise(r => setTimeout(r, ms))

class NeutralinoExtension extends EventEmitter {
    VERBOSE_EVENTS = false
    constructor(){
        super()
        this.nlConnectToken = null
        this.nlExtensionId = null
        this.nlPort = null
        this.nlToken = null
        this.nlClients = 0
        this.on("appClientConnect", _ => this.nlClients++)
        this.on("appClientDisconnect", _ => this.nlClients--)

        /** @type {WebSocket} */
        this.nlWebsocket = null
    }
    async readStdinConfig(){
        const { nlConnectToken, nlExtensionId, nlPort, nlToken } = await new Promise((res, rej) => {    
            process.stdin.setEncoding("utf-8").once("data", function(data){
                let o = null
                try {
                    o = JSON.parse(data)
                } catch(e){
                    rej(e)
                    return null
                }
                res(o)
            }).resume()
        })
        this.nlConnectToken = nlConnectToken
        this.nlExtensionId = nlExtensionId
        this.nlPort = nlPort
        this.nlToken = nlToken
    }
    onNeutralinoClose(){
        log("Neutralino closed the connection. Quitting.")
        process.exit(0)
    }
    onNeutralinoWSError(err){
        log("Neutralino WS got error: ", err)
    }
    onNeutralinoWSMsg(wsData, isBinary){
        let {event, method, data} = JSON.parse(wsData.toString("utf-8"))
        if(!event) // Possibly answering to a method call.
            return;
        if(this.listenerCount(event) > 0)
            this.emit(event, data)
        else if(this.VERBOSE_EVENTS)
            log("Neutralino sent event: ", event)
    }
    async broadcastNeutralino(data, eventName = "eventFromExtension"){
        await this.invokeNeutralino("app.broadcast", { 
            "event": eventName,
            "data": data
        })
    }
    invokeNeutralino(method = "app.broadcast", data = {}){
        return new Promise((res, rej) => {
            this.nlWebsocket.send(JSON.stringify({
                "id": randomUUID(),
                "method": method,
                "accessToken": this.nlToken,
                "data": data
            }), (err)=>{
                err ? rej(err) : res()
            })
        })
    }
    connectNeutralino(){
        let self = this
        return new Promise((res, rej)=> {
            let {nlPort, nlExtensionId, nlConnectToken, nlToken} = self
            const NL_CONN_URI = `ws://localhost:${nlPort}?extensionId=${nlExtensionId}&connectToken=${nlConnectToken}`
            let ws = self.nlWebsocket = new WebSocket(NL_CONN_URI)
            let hadError = function(err){
                log("Couldn't connect to WS: ", err)
                rej(err)
            }
            ws.once("error", hadError)
            // ws.on("ping", function(data){ log("has ping")})
            // ws.on("pong", function(data){ log("has pong")})
            // ws.on("unexpected-response", function(){log("has wtf")})
            ws.once("open", function(){ 
                ws.off("error", hadError)
                ws.on("close", self.onNeutralinoClose.bind(self))
                ws.on("error", self.onNeutralinoWSError.bind(self))
                ws.on("message", self.onNeutralinoWSMsg.bind(self))
                res()
            })
        })
    }
    async init(){
        // Step 1: Get the config
        try {
            await this.readStdinConfig()
        } catch(e){
            log("No Neutralino config received. Exiting.")
            process.exit(1)
            return
        }

        log("Received Neutralino info. Connecting...")

        // Step 2: Ok, now connect to NL ws.
        try {
            await this.connectNeutralino()
        } catch(e){
            log("Exiting.")
            process.exit(1)
            return
        }

        log("Successfully plugged into Neutralino.")

        //Step 3: I'm all set.
    }
}

let extension = new NeutralinoExtension()
await extension.init()
let ourToken = Date.now()

extension.on("pingpong", async function(data){
    if(data.from != "app") return
    if(data.ourToken != ourToken) return

    console.log("Received ping-pong from app", data)
    await sleep(1000)
    await extension.broadcastNeutralino({value: data.value+0.5, ourToken, from: "extension"}, "pingpong")

})

await new Promise(r => extension.once("appClientConnect", _ => r()))
log("Client connected, sending something.")
await extension.broadcastNeutralino({initial: 0.5, ourToken}, "startPingpong")