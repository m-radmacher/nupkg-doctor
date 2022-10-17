import * as core from "@actions/core";
import * as exec from "@actions/exec";
import extract from "extract-zip";
import * as fs from "fs";
import { XMLBuilder, XMLParser } from "fast-xml-parser";
import path from "path";
import archiver from "archiver";

async function run() {
  const version = core.getInput("version").trim();
  const repository = core.getInput("repository");
  const pat = core.getInput("token");
  const pushToReg = core.getBooleanInput("push");
  const skipDuplicate = core.getBooleanInput("skipduplicate");
  const dir = core.getInput("directory");
  const base = process.env.GITHUB_WORKSPACE as string;
  const baseDirectory = path.join(base, dir);

  core.debug("Repository: " + repository);
  core.debug("Base directory: " + baseDirectory);
  core.debug("Version: " + version);

  // Validate Version
  if (version) {
    const versionRegex = new RegExp("^(0|[1-9]d*).(0|[1-9]d*).(0|[1-9]d*)$");
    if (!versionRegex.exec(version)) {
      core.debug(`The version string *${version}* does not match ^(0|[1-9]d*).(0|[1-9]d*).(0|[1-9]d*)$`)
      throw new Error(
        "Version *" + version + "* is not a valid semver version. (x.x.x)"
      );
    }
  }

  // list all files & find .nupkg
  let nupkgFile;
  const nupkgFiles = fs.readdirSync(baseDirectory);
  console.log("Searching for .nupkg...");
  core.debug("Found these files: " + nupkgFiles.join("; "));
  for (const file of nupkgFiles) {
    if (file.endsWith(".nupkg")) {
      nupkgFile = file;
      break;
    }
  }
  if (!nupkgFile) {
    throw new Error("Could not find .nupkg file. Make sure it got generated.");
  }
  console.log("Found .nupkg file. Extracting...");

  await extract(path.join(baseDirectory, nupkgFile), {
    dir: path.join(baseDirectory, "extracted-nupkg"),
  });

  // Find .nuspec file
  console.log("Extracted .nupkg file content. Searching for .nuspec file...");
  let nuspecFile;
  const nuspecFiles = fs.readdirSync(
    path.join(baseDirectory, "extracted-nupkg")
  );
  for (const file of nuspecFiles) {
    if (file.endsWith(".nuspec")) {
      nuspecFile = file;
      break;
    }
  }
  if (!nuspecFile) {
    throw new Error("Could not find .nuspec file.");
  }
  console.log("Found .nuspec file. Reading File...");

  // Read .nuspec file
  const nuspecFileContent = fs.readFileSync(
    path.join(baseDirectory, "extracted-nupkg", nuspecFile)
  );
  core.debug(".nuspec content: " + nuspecFileContent);
  console.log("Read .nuspec file. Parsing file...");

  // Parse .nuspec File
  const parser = new XMLParser({ ignoreAttributes: false });
  const jsonObject = parser.parse(nuspecFileContent);
  core.debug("Parsed .nuspec content: " + JSON.stringify(jsonObject));
  console.log("Parsed .nuspec file. Modifying file...");

  // Add fields to object
  jsonObject.package.metadata.repository = {
    "@_type": "git",
    "@_url": `https://github.com/${repository}`,
  };

  // Change Version
  if (version) {
    jsonObject.package.metadata.version = version;
    console.log("Set version to " + version);
  }

  // Write new .nuspec File
  const builder = new XMLBuilder({ format: true, ignoreAttributes: false });
  const xmlContent = builder.build(jsonObject);
  core.debug("Modified XML: " + xmlContent);
  fs.writeFileSync(
    path.join(baseDirectory, "extracted-nupkg", nuspecFile),
    xmlContent
  );
  console.log("Modified .nuspec file. Deleting old .nupkg...");

  // delete old .nupkg
  fs.rmSync(path.join(baseDirectory, nupkgFile));
  console.log("Deleted old .nupkg. Writing new .nupkg...");

  // Zip files
  const archive = archiver("zip");
  let outputFile = nupkgFile;
  if (version) {
    const nugetName = nupkgFile.split(".")[0];
    if (!nugetName) {
      throw new Error("Could not parse NuGet file name");
    }
    outputFile = `${nugetName}.${version}.nupkg`;
    core.debug(`New output file name: ${outputFile}`);
  }
  const output = fs.createWriteStream(path.join(baseDirectory, outputFile));
  output.on("close", () => {
    console.log(
      `Wrote new .nupkg (${archive.pointer()} bytes). ${
        pushToReg ? "Pushing .nupkg to GitHub registry..." : ""
      }`
    );
  });
  archive.on("error", (err) => {
    console.error("Encountered an error while zipping files.");
    throw err;
  });
  archive.pipe(output);
  archive.directory(path.join(baseDirectory, "extracted-nupkg"), false);
  await archive.finalize();

  if (!pushToReg) return;

  // Push .nupkg to GitHub Registry
  const owner = repository.split("/")[0];
  if (!owner) {
    throw new Error(
      "Could not find owner of repository. Make sure the repository you passed is valid (<Owner>/<Repository>)"
    );
  }
  exec.exec(
    "nuget",
    [
      "push",
      path.join(baseDirectory, outputFile),
      "-Source",
      `https://nuget.pkg.github.com/${owner}/index.json`,
      "-ApiKey",
      pat,
      "-NonInteractive",
      `${skipDuplicate ? "-SkipDuplicate" : ""}`,
    ],
    {
      listeners: {
        stdout: (data: Buffer) => {
          console.log(data.toString());
        },
        stderr: (data: Buffer) => {
          console.error(data.toString());
        },
      },
    }
  );
  console.log("Pushed .nupkg to GitHub repository.");
}

run();
