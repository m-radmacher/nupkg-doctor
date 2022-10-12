import * as core from "@actions/core";
import * as io from "@actions/io";
import extract from 'extract-zip';
import * as fs from 'fs';
import { XMLBuilder, XMLParser } from "fast-xml-parser";
import path from "path";

async function run() {
  const baseDirectory = core.getInput('directory');
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

  await extract(path.join(__dirname, baseDirectory, nupkgFile), { dir: "extracted-nupkg" });

  // Find .nuspec file
  console.log("Extracted .nupkg file content. Searching for .nuspec file...");
  let nuspecFile;
  const nuspecFiles = fs.readdirSync(path.join(baseDirectory, "extracted-nupkg"));
  for (const file of nuspecFiles) {
    if (file.endsWith('.nuspec')) {
      nuspecFile = file;
      break;
    }
  }
  if (!nuspecFile) {
    throw new Error('Could not find .nuspec file.');
  }
  console.log('Found .nuspec file. Reading File...');

  // Read .nuspec file
  const nuspecFileContent = fs.readFileSync(path.join(baseDirectory, "extracted-nupkg", nuspecFile));
  core.debug(".nuspec content: " + nuspecFileContent);
  console.log("Read .nuspec file. Parsing file...")

  // Parse .nuspec File
  const parser = new XMLParser({ ignoreAttributes: false });
  const jsonObject = parser.parse(nuspecFileContent);
  core.debug("Parsed .nuspec content: " + JSON.stringify(jsonObject));
  console.log("Parsed .nuspec file. Modifying file...");

  // Add fields to object
  jsonObject.repository = "Test";

  // Write new .nuspec File
  const builder = new XMLBuilder({});
  const xmlContent = builder.build(jsonObject);
  core.debug("Modified XML: " + xmlContent);
  fs.writeFileSync(nuspecFile, xmlContent);
}

run();
