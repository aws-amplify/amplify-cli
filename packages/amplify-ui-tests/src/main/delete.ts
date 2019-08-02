import { deleteProject } from "../init";
import { existsSync } from "fs";

//node delete.js [projectRoot]
async function deleteProj(projRoot: string) {
    await deleteProject(projRoot);
}

if (process.argv.length !== 3) {
    console.log('Usage: node ./lib/main/delete [project_root]');
    process.exit(1);
}
const projRoot = process.argv[2];
if (!existsSync(projRoot)) {
    console.log('Project path does not exist.');
    process.exit(1);
}
deleteProj(process.argv[2]);