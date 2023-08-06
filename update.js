const fs = require("fs");
const cp = require("child_process");

function exec(command) {
    try {
        return cp.execSync(command, {
            maxBuffer: 1024 * 1024 * 512 // 512MB
        });
    } catch (err) {
        console.warn(err.message);
        return cp.execSync(command, {
            stdio: "ignore",
            maxBuffer: 1024 * 1024 * 512 // 512MB
        });
    }
}

const VERSION = process.argv[2];

exec("sudo apt update");

switch (VERSION) {
    case "1.13.2": case "1.14.4": case "1.15.2": case "1.16.5":
        exec("sudo apt install java-common openjdk-8-jdk openjdk-8-jre");
        exec("sudo update-java-alternatives --set /usr/lib/jvm/java-1.8.0-openjdk-amd64");
        break;

    case "1.17.1": case "1.18.2": case "1.19.4": case "1.20.1":
        exec("sudo apt install java-common openjdk-17-jdk openjdk-17-jre");
        exec("sudo update-java-alternatives --set /usr/lib/jvm/java-1.17.0-openjdk-amd64");
        break;
    
    default:
        process.exit(-1);
}

exec("curl -o BuildTools.jar https://hub.spigotmc.org/jenkins/job/BuildTools/lastSuccessfulBuild/artifact/target/BuildTools.jar");
exec(`java -jar BuildTools.jar --rev ${VERSION} --compile spigot`);