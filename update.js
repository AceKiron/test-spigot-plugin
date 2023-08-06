const fs = require("fs");
const cp = require("child_process");

// Default max buffer of 256MB
function exec(command, maxBuffer=1024*1024*256) {
    return cp.execSync(command);
}

exec("sudo apt update");

switch (process.argv[2]) {
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
exec(`java -jar BuildTools.jar --rev ${process.argv[2]} --compile spigot`);

try {
    exec(`git add spigot-${process.argv[2]}.jar`);
    exec(`git commit -m "Update ${process.argv[2]} server JAR"`);
    exec("git push -u origin main");
} catch (err) {
    console.warn("Couldn't push updated JAR, perhaps nothing changed?");
    console.warn(err.message);
}