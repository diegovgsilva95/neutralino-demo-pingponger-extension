Neutralino.init()
Neutralino.events.on("windowClose", function(){
    Neutralino.app.exit()
})
var ourToken = null
await Neutralino.events.on("startPingpong", async function({detail: data}){
    console.log(data)
    console.log("sending")
    ourToken = data.ourToken
    console.log({
        value: (data.initial||0)+1,
        ourToken,
        from: "app"
    })
    
    document.querySelector("h1").innerText = "Ready?"
    await Neutralino.events.broadcast("pingpong", {
        value: (data.initial||0)+1,
        ourToken,
        from: "app"
    })
})

await Neutralino.events.on("pingpong", async function({detail: data}){
    console.log("Got pingpong")
    if(data.from != "extension") return
    if(data.ourToken != ourToken) return
    console.log(data)
    document.querySelector("h1").innerText = String(data.value)

    await Neutralino.events.broadcast("pingpong", {value: data.value+0.5,ourToken, from: "app"})
})
