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
    switch (version) {
        case "1.13.2": case "1.14.4": case "1.15.2": case "1.16.5":
            await exec.exec("sudo add-apt-repository ppa:linuxuprising/java");
            await exec.exec("sudo apt update");
            await exec.exec("sudo apt install oracle-java16-installer");
            await exec.exec("sudo update-java-alternatives --list");
            break;

        case "1.17.1": case "1.18.2": case "1.19.4": case "1.20.1":
            await exec.exec("sudo apt install java-common openjdk-17-jdk openjdk-17-jre");
            await exec.exec("sudo update-java-alternatives --set /usr/lib/jvm/java-1.17.0-openjdk-amd64");
            break;
        
        default:
            core.setFailed(`Unsupported Minecraft version: ${version}`);
            return;
    }

    if (core.isDebug()) {
        await exec.exec(`curl -v -o BuildTools.jar ${buildtools}`);
        await exec.exec(`curl -v -o eula.txt https://raw.githubusercontent.com/AceKiron/test-spigot-plugin/main/accept-eula.txt`);
    } else {
        await exec.exec(`curl -o BuildTools.jar ${buildtools}`);
        await exec.exec(`curl -o eula.txt https://raw.githubusercontent.com/AceKiron/test-spigot-plugin/main/accept-eula.txt`);
    }

    await exec.exec(`java -jar BuildTools.jar --rev ${version} --compile spigot`);
    
    await io.mkdirP(path.join(__dirname, "plugins"));
    await artifactClient.downloadArtifact(artifactName, path.join(__dirname, "plugins"), {
        createArtifactFolder: false
    });

    await exec.exec(`ls -a ${path.join(__dirname, "plugins")}`);

    const promise = exec.exec(`java -jar spigot-${version}.jar`, undefined, {
        listeners: {
            stdout: (data) => {
                if (data.toString().match(/^\[\S+ WARN\].+/)) console.warn(data.toString());
                else if (data.toString().match(/^\[\S+ ERROR\].+/)) console.error(data.toString());

                else if (data.toString().match(/^\[\S+ INFO\]: Done \(.s\)! For help, type "help"\n/g) != null) console.log("finish");
            },
            stderr: (data) => {
                console.error(data.toString());
            }
        },
        input: "stop"
    });
})().catch(err => {
    core.setFailed(`Failed to test plugin: ${err}`);
});