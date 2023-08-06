const fs = require("fs");
const cp = require("child_process");

cp.execSync("sudo apt update");

switch (process.argv[2]) {
    case "1.13.2": case "1.14.4": case "1.15.2": case "1.16.5":
        cp.execSync("sudo apt install java-common openjdk-8-jdk openjdk-8-jre");
        cp.execSync("sudo update-java-alternatives --set /usr/lib/jvm/java-1.8.0-openjdk-amd64");
        break;

    case "1.17.1": case "1.18.2": case "1.19.4": case "1.20.1":
        cp.execSync("sudo apt install java-common openjdk-17-jdk openjdk-17-jre");
        cp.execSync("sudo update-java-alternatives --set /usr/lib/jvm/java-1.17.0-openjdk-amd64");
        break;
    
    default:
        process.exit(-1);
}

console.log("Made it to checkpoint 1");
cp.execSync("curl -o BuildTools.jar https://hub.spigotmc.org/jenkins/job/BuildTools/lastSuccessfulBuild/artifact/target/BuildTools.jar");
console.log("Made it to checkpoint 2");
cp.execSync(`java -jar BuildTools.jar --rev ${process.argv[2]} --compile spigot`);