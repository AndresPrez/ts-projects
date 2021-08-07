#!/usr/bin/env node

import * as fs from "fs";
import rimraf from "rimraf";
import * as path from "path";
import * as inquirer from "inquirer";
import * as template from "./utils/template";
import downloadUrl from "download";

import chalk from "chalk";

const CURR_DIR = process.cwd();
const SKIP_FILES = ["node_modules", "dist", "build"];
const TENMPLATE_FILES = ["package.json"];
const MY_REPOS = ["nestjs-server", "tsoa-server", "ts-react-native"];
const myRepoUrl = (repoName: string) => `https://github.com/AndresPrez/${repoName}/archive/refs/heads/master.zip`;
const QUESTIONS = [
  {
    name: "projectChoice",
    type: "list",
    message: "What project template would you like to use?",
    choices: MY_REPOS,
  },
  {
    name: "name",
    type: "input",
    message: "New project name?",
  },
];

inquirer.prompt(QUESTIONS).then(async (answers) => {
  const projectChoice = answers["projectChoice"];
  const projectName = answers["name"];
  const targetPath = path.join(CURR_DIR, projectName);
  const repoFilesTargetPath = path.join(__dirname, "templates", projectChoice);

  await downloadRepoProjectFiles(myRepoUrl(projectChoice), repoFilesTargetPath);

  const templatePath = path.join(__dirname, "templates", projectChoice);
  // const options: CliOptions = {
  //   projectName,
  //   templateName: projectChoice,
  //   templatePath,
  //   targetPath,
  // };
  if (!createProject(targetPath)) {
    return;
  }

  createDirectoryContents(templatePath, projectName);

  deleteTemplateDirectory(templatePath);
});

// export interface CliOptions {
//   projectName: string;
//   templateName: string;
//   templatePath: string;
//   targetPath: string;
// }

async function downloadRepoProjectFiles(repoUrl: string, targetPath: string) {
  if (!fs.existsSync(targetPath)) {
    fs.mkdirSync(targetPath, { recursive: true });
  }
  return new Promise((resolve: any, reject: any) => {
    var downloadOptions = {
      extract: true,
      strip: 1,
      mode: "666",
      headers: {
        accept: "application/zip",
      },
    };
    console.log("downloading files to", targetPath);
    downloadUrl(repoUrl, targetPath, downloadOptions)
      .then(function (data) {
        console.log("Template files downloaded");
        return resolve();
      })
      .catch(function (err) {
        console.log("Error downloading template files", err);
        return reject();
      });
  });
}

function createProject(projectPath: string) {
  if (fs.existsSync(projectPath)) {
    console.info(chalk.red(`Folder ${projectPath} exists. Delete or use another name.`));
    return false;
  }
  fs.mkdirSync(projectPath);
  console.info(`Project folder created: ${projectPath}`);
  return true;
}

function createDirectoryContents(templatePath: string, projectName: string) {
  // read all files/folders (1 level) from template folder
  const filesToCreate = fs.readdirSync(templatePath);
  // loop each file/folder
  filesToCreate.forEach((file) => {
    const origFilePath = path.join(templatePath, file);

    // get stats about the current file
    const stats = fs.statSync(origFilePath);

    // skip files that should not be copied
    if (SKIP_FILES.indexOf(file) > -1) return;

    if (stats.isFile()) {
      let contents = fs.readFileSync(origFilePath, "utf8");
      if (TENMPLATE_FILES.includes(origFilePath)) {
        // read template file content and transform it using template engine
        contents = template.render(contents, { projectName: template.projectNameParse(projectName) });
      }
      // write file to destination folder
      const writePath = path.join(CURR_DIR, projectName, file);
      fs.writeFileSync(writePath, contents, "utf8");
    } else if (stats.isDirectory()) {
      // create folder in destination folder
      fs.mkdirSync(path.join(CURR_DIR, projectName, file));
      // copy files/folder inside current folder recursively
      createDirectoryContents(path.join(templatePath, file), path.join(projectName, file));
    }
  });
}

function deleteTemplateDirectory(templatePath: string) {
  rimraf.sync(templatePath);
}
