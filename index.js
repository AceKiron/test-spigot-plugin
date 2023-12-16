const core = require("@actions/core");
const exec = require("@actions/exec");
const io = require("@actions/io");
const artifact = require("@actions/artifact");

const fs = require("fs");
const path = require("path");
const yaml = require("yaml");

const artifactClient = artifact.create();

const version = core.getInput("minecraft-version");
const artifactName = core.getInput("artifact-name");

const yamlConfig = yaml.parse(fs.readFileSync(path.join(".", ".acekiron", "test-spigot-plugin.yml"), "utf8"));

class Test {
    constructor() {
        this.requiredMessagesLeft = yamlConfig["required-messages"] || [];
    }

    markRequiredMessageCompleted(message) {
        console.log(`Mark required message as completed: ${message}`);
        const index = this.requiredMessagesLeft.indexOf(message);
        if (index > -1) this.requiredMessagesLeft.splice(index, 1);
    }

    isSuccess() {
        return this.requiredMessagesLeft.length == 0;
    }
}
const test = new Test();

let curlCommand = "curl";
if (core.isDebug()) {
    curlCommand += " -v";
}

(async function() {
    await exec.exec("sudo apt update");
    
    switch (version) {
        case "1.13.2": case "1.14.4": case "1.15.2": case "1.16.5":
            await exec.exec("sudo apt install java-common openjdk-8-jdk openjdk-8-jre");
            await exec.exec("sudo update-java-alternatives --set /usr/lib/jvm/java-1.8.0-openjdk-amd64");
            break;

        case "1.17.1": case "1.18.2": case "1.19.4": case "1.20.4":
            await exec.exec("sudo apt install java-common openjdk-17-jdk openjdk-17-jre");
            await exec.exec("sudo update-java-alternatives --set /usr/lib/jvm/java-1.17.0-openjdk-amd64");
            break;
        
        default:
            core.setFailed(`Unsupported Minecraft version: ${version}`);
            return;
    }

    await exec.exec(`${curlCommand} -o spigot.jar https://raw.githubusercontent.com/AceKiron/test-spigot-plugin/main/spigot-${version}.jar`);
    await exec.exec(`${curlCommand} -o eula.txt https://raw.githubusercontent.com/AceKiron/test-spigot-plugin/main/accept-eula.txt`);

    await io.mkdirP(path.join(".", "plugins"));
    await artifactClient.downloadArtifact(artifactName, path.join(".", "plugins"), {
        createArtifactFolder: false
    });

    for (const dependency of fs.readdirSync(path.join(".", ".acekiron", "test-spigot-plugin"))) {
        await io.cp(path.join(".", ".acekiron", "test-spigot-plugin", dependency), path.join(".", "plugins", dependency));
    }

    if (core.isDebug()) {
        await exec.exec("ls -R plugins");
    }

    await exec.exec(`java -jar spigot.jar`, undefined, {
        listeners: {
            stdout: (data) => {
                for (const line of data.toString().split("\n")) {
                    if (line.match(/^\[.+WARN\].+/)) console.warn(line);
                    else if (line.match(/^\[.+ERROR\].+/)) console.error(line);

                    else {
                        for (const message of test.requiredMessagesLeft) {
                            if (line.match(new RegExp(`\\[.+INFO\\]: ${message}`)) != null) {
                                test.markRequiredMessageCompleted(message);
                                break;
                            }
                        }
                    }
                }
            }
        },
        input: "stop"
    });

    if (!test.isSuccess()) core.setFailed(`Test failed\n${test.requiredMessagesLeft.join("\n")}`);
})().catch(err => {
    core.setFailed(`Failed to test plugin: ${err}`);
});
