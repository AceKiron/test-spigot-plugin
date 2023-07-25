const core = require("@actions/core");
const exec = require("@actions/exec");
const io = require("@actions/io");
const artifact = require("@actions/artifact");

const fs = require("fs");
const path = require("path");
const yaml = require("yaml");

const artifactClient = artifact.create();

const version = core.getInput("minecraft-version");
const buildtools = core.getInput("buildtools");
const artifactName = core.getInput("artifact-name");

const requiredMessages = yaml.parse(fs.readFileSync(path.join(".", ".acekiron", "test-spigot-plugin.yml"), "utf8"))["required-messages"];

class Test {
    constructor() {
        this.requiredMessagesLeft = requiredMessages;
    }

    markRequiredMessageCompleted(message) {
        console.log(`Mark required message as completed: ${message}`);
        const index = this.requiredMessagesLeft.indexOf(message);
        if (index > -1) {
            this.requiredMessagesLeft.splice(index, 1);
        }
    }

    isSuccess() {
        if (this.requiredMessagesLeft.length > 0) return false;
        return true;
    }
}
const test = new Test();

(async function() {
    switch (version) {
        case "1.13.2": case "1.14.4": case "1.15.2": case "1.16.5":
            await exec.exec("sudo apt install java-common openjdk-8-jdk openjdk-8-jre");
            await exec.exec("sudo update-java-alternatives --set /usr/lib/jvm/java-1.8.0-openjdk-amd64");
            
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
    
    await io.mkdirP(path.join(".", "plugins"));
    await artifactClient.downloadArtifact(artifactName, path.join(".", "plugins"), {
        createArtifactFolder: false
    });

    const promise = exec.exec(`java -jar spigot-${version}.jar`, undefined, {
        listeners: {
            stdout: (data) => {
                if (data.toString().match(/^\[.+WARN\].+/)) console.warn(data.toString());
                else if (data.toString().match(/^\[.+ERROR\].+/)) console.error(data.toString());

                else if (data.toString().match(/^\[.+INFO\]: Done \(.+s\)! For help, type "help"\n/g) != null) console.log("finish");

                else {
                    for (const message of test.requiredMessagesLeft) {
                        if (data.toString().match(new RegExp(`^\\[.+INFO\\]: ${message}`)) != null) {
                            test.markRequiredMessageCompleted(message);
                            break;
                        }
                    }
                }
            },
            stderr: (data) => {
                console.error(data.toString());
            }
        },
        input: "stop"
    });

    if (!test.isSuccess()) {
        core.setFailed(`Test failed\n${test.requiredMessagesLeft.toString()}`);
    }
})().catch(err => {
    core.setFailed(`Failed to test plugin: ${err}`);
});