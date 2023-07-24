const core = require("@actions/core");
const exec = require("@actions/exec");
const io = require("@actions/io");
const artifact = require("@actions/artifact");

const path = require("path");

const artifactClient = artifact.create();

const version = core.getInput("minecraft-version");
const buildtools = core.getInput("buildtools");
const artifactName = core.getInput("artifact-name");

(async function() {
    if (core.isDebug()) {
        await exec.exec(`curl -v -o BuildTools.jar ${buildtools}`);
        await exec.exec(`curl -v -o eula.txt https://raw.githubusercontent.com/AceKiron/test-spigot-plugin/main/accept-eula.txt`);
    } else {
        await exec.exec(`curl -o BuildTools.jar ${buildtools}`);
        await exec.exec(`curl -o eula.txt https://raw.githubusercontent.com/AceKiron/test-spigot-plugin/main/accept-eula.txt`);
    }

    await exec.exec(`java -jar BuildTools.jar --rev ${version}`);
    
    await io.mkdirP(path.join(__dirname, "plugins"));

    const downloadResponse = await artifactClient.downloadArtifact(artifactName, path.join(__dirname, "plugins"), {
        createArtifactFolder: false
    });

    await exec.exec(`java -jar spigot-${version}.jar`, undefined, {
        stdout: (data) => {
            console.log(`stdout: "${data}"`);
        }
    });
})().catch(err => {
    core.setFailed(`Failed to test plugin: ${err}`);
});