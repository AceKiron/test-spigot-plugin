const core = require("@actions/core");
const exec = require("@actions/exec");

(async function() {
    const version = core.getInput("minecraft-version");
    const buildtools = core.getInput("buildtools");

    await exec.exec(`curl -o BuildTools.jar ${buildtools}`);
})().catch(err => {
    core.setFailed(`Failed to test plugin: ${err}`);
});