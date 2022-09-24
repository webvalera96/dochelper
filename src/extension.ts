// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import {createHash} from 'crypto';
import {relative} from 'path';
import {createWriteStream} from 'fs';
import { EOL } from 'os';


export function activate(context: vscode.ExtensionContext) {	

	let disposable = vscode.commands.registerCommand('dochelper.checksum', async () => {		
		if (vscode.workspace.workspaceFolders === undefined) {
			vscode.window.showErrorMessage('Необходимо открыть папку');
		} else {
			for (let wsFolder of vscode.workspace.workspaceFolders)
			{
				let files = await vscode.workspace.findFiles('**/*.{md,png}');
			
				class FileHashInfo {
					rootPath: string;
					filePath: string;
					hash: string;

					constructor(absFilePath: string, hash: string, rootPath: string) {
						this.rootPath = rootPath;
						this.filePath = relative(rootPath, absFilePath);
						this.hash = hash;
					}

					toString() {
						return `${this.hash} *${this.filePath}`;
					}
				};

				let filesHashInfo: FileHashInfo[] = [];
				
				for (let fileUri of files) {
					let fileContent = await vscode.workspace.fs.readFile(fileUri);			
					let digest = createHash('sha256').update(fileContent).digest('hex');
					filesHashInfo.push(new FileHashInfo(fileUri.fsPath, digest, wsFolder.uri.fsPath));													
				}				
				
				const checkSumFilePath = vscode.Uri.file(wsFolder.uri.fsPath + `/${wsFolder.name}.sha256`);
				let writeStream = createWriteStream(checkSumFilePath.fsPath);
				for (let fileHashInfo of filesHashInfo ) {
					writeStream.write(fileHashInfo.toString() + EOL);
				}				
				writeStream.end();			
				let doc = await vscode.workspace.openTextDocument(checkSumFilePath);
				vscode.window.showTextDocument(doc);
				vscode.window.showInformationMessage('Контрольная сумма подсчитана');
			}				
		}			
	});	

	context.subscriptions.push(disposable);

}

export function deactivate() {}
