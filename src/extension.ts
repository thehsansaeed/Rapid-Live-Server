import * as vscode from 'vscode';
import * as path from 'path';
import express from 'express';
import cors from 'cors';
import fs from 'fs';

export function activate(context: vscode.ExtensionContext) {
    // Register the command to run the HTML on the server
    const disposable = vscode.commands.registerCommand('extension.runHtmlOnServer', () => {
        runServer(context);
    });

    context.subscriptions.push(disposable);
}

function runServer(context: vscode.ExtensionContext) {
    const app = express();
    const port = 3001;

    // Use the extension's directory as the static content root
    app.use(express.static(context.extensionPath));
    app.use(cors());

    app.get('/', (req: express.Request, res: express.Response) => {
        // Get the currently active text editor
        const activeEditor = vscode.window.activeTextEditor;

        if (activeEditor) {
            // Get the file path of the currently active file
            const filePath = activeEditor.document.fileName;

            // Check if the file has a valid extension (html or php)
            const validExtensions = ['.html', '.php'];
            const fileExtension = path.extname(filePath);

            if (validExtensions.includes(fileExtension)) {
                // Read the content of the file
                const fileContent = fs.readFileSync(filePath, 'utf-8');

                // If it's a PHP file, you may want to process it through a PHP interpreter
                if (fileExtension === '.php') {
                    // Assuming you have PHP installed on your machine
                    // You can modify this command based on your PHP installation
                    const phpCommand = `php -r "echo file_get_contents('${filePath}');"`
                    const phpContent = require('child_process').execSync(phpCommand).toString();

                    // Add the auto-refresh meta tag
                    const modifiedContent = addAutoRefreshMetaTag(phpContent);
                    res.send(modifiedContent);
                } else {
                    // For HTML files, directly add the auto-refresh meta tag
                    const modifiedContent = addAutoRefreshMetaTag(fileContent);
                    res.send(modifiedContent);
                }
            } else {
                res.status(404).send('Invalid file type');
            }
        } else {
            res.status(404).send('No active file');
        }
    });

    const server = app.listen(port, () => {
        console.log(`Server is running at http://localhost:${port}`);
    });

    vscode.window.showInformationMessage(`Server is running at http://localhost:${port}`);
}

function addAutoRefreshMetaTag(htmlContent: string): string {
    // Add the meta tag for auto-refresh every 3 seconds
    const autoRefreshMetaTag = '<meta http-equiv="refresh" content="3">';
    
    // Find the opening <head> tag in the HTML content
    const headTagIndex = htmlContent.indexOf('<head>');
    
    if (headTagIndex !== -1) {
        // Insert the auto-refresh meta tag after the opening <head> tag
        return htmlContent.slice(0, headTagIndex + '<head>'.length) + autoRefreshMetaTag + htmlContent.slice(headTagIndex + '<head>'.length);
    } else {
        // If <head> tag is not found, just prepend the auto-refresh meta tag to the content
        return autoRefreshMetaTag + htmlContent;
    }
}

export function deactivate() {
    // Clean up resources on extension deactivation if needed
}
