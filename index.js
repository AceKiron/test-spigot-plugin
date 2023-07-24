const core = require("@actions/core");
const exec = require("@actions/exec");
const io = require("@actions/io");

const path = require("path");

(async function() {
    const version = core.getInput("minecraft-version");
    const buildtools = core.getInput("buildtools");

    if (core.isDebug())
        await exec.exec(`curl -v -o BuildTools.jar ${buildtools}`);
    else
        await exec.exec(`curl -o BuildTools.jar ${buildtools}`);

    await exec.exec(`java -jar BuildTools.jar --rev ${version}`);

    await io.mv(path.join(__dirname, "Spigot", "Spigot-Server", "target", "spigot-*.jar"), path.join(__dirname, "server.jar"));
    
    await exec.exec(`java -jar server.jar`);
})().catch(err => {
    core.setFailed(`Failed to test plugin: ${err}`);
});