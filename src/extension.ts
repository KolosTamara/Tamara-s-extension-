// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { type } from 'os';
import * as vscode from 'vscode';
import { parentPort } from 'worker_threads';


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	
	let currentPanel: vscode.WebviewPanel | undefined = undefined;
	let text = "";
	let activeEditor = undefined;
	
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "tamarasextension" is now active!');
	
	const updateWebview = () => {
		if(currentPanel)
		{
			activeEditor = vscode.window.activeTextEditor;
			if(activeEditor)
			{
				currentPanel.webview.html = getWebviewContent(activeEditor.document);
			}
			else
			{
				currentPanel.webview.html = getWebviewContent(undefined);
			}
		}
	}

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('tamarasextension.tamara', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		
			if(currentPanel)
			{
				currentPanel.reveal(vscode.ViewColumn.Beside);
				updateWebview();
			}
			else
			{
				currentPanel = vscode.window.createWebviewPanel(
					'Tamara',
					'Tamara extension',
					vscode.ViewColumn.Beside,
					{}
					);
				updateWebview();

				currentPanel.onDidDispose(
					() => {
					  currentPanel = undefined
					},
					null,
					context.subscriptions
				  );
			}
		});

	context.subscriptions.push(disposable);
}


function checkForHeadings(document: vscode.TextDocument, lineIndex: number) : [string, number]
{
	var foundHeading = false;
	var firstLineText = document.lineAt(lineIndex).text;
	var secondLineText = ""
	if(document.lineCount > lineIndex + 1)
	{
		secondLineText = document.lineAt(lineIndex + 1).text;
	}
	var firstWordOfFirstLine = firstLineText.split(" ", 1);
	var returnHTMLText = "";
	var returnIncrement = 0;

	if(firstWordOfFirstLine[0].charAt(0) == '#')
	{
		foundHeading = true;
		for(let char of firstWordOfFirstLine[0])
		{
			if(char != '#')
			{
				foundHeading = false;
				break
			}
		}

		if(foundHeading)
		{
			switch(firstWordOfFirstLine[0].length)
			{
				case 1:
					returnHTMLText += `<h1>${firstLineText.substring(firstWordOfFirstLine[0].length)}</h1>`;
					break;
				case 2:
					returnHTMLText += `<h2>${firstLineText.substring(firstWordOfFirstLine[0].length)}</h2>`;
					break;
				case 3:
					returnHTMLText += `<h3>${firstLineText.substring(firstWordOfFirstLine[0].length)}</h3>`;
					break;
				case 4:
					returnHTMLText += `<h4>${firstLineText.substring(firstWordOfFirstLine[0].length)}</h4>`;
					break;
				case 5:
					returnHTMLText += `<h5>${firstLineText.substring(firstWordOfFirstLine[0].length)}</h5>`;
					break;
				case 6:
					returnHTMLText += `<h6>${firstLineText.substring(firstWordOfFirstLine[0].length)}</h6>`;
					break;
			}
		}
	}

	if(secondLineText.length > 0)
	{
		if(secondLineText[0] == '=')
		{
			foundHeading = true;
			for(let char of secondLineText)
			{
				if(char != '=')
				{
					foundHeading = false;
					break
				}
			}
			
			if(foundHeading)
			{
				returnHTMLText += `<h1>${firstLineText}</h1>`;
				returnIncrement++;
			}
		}
		else if(secondLineText[0] == '-')
		{
			foundHeading = true;
			for(let char of secondLineText)
			{
				if(char != '-')
				{
					foundHeading = false;
					break
				}
			}
			
			if(foundHeading)
			{
				returnHTMLText += `<h2>${firstLineText}</h2>`;
				returnIncrement++;
			}
		}
	}
	
	return [returnHTMLText, returnIncrement];
}

function checkForEmphasis(lineText: string)
{
	if(lineText.length > 0)
	{
		var wordType = -1
		var wordStart = "";
		var wordLength = 0

		for(var i = 0; i < lineText.length - 1; i++)
		{
			if(wordStart.length != 0)
			{
				wordLength++;
			}

			if(lineText[i] == '*')
			{
				if(lineText[i + 1] == '*')
				{
					if(wordStart.length != 0 && wordType == 0)
					{
						var word = wordStart.substring(0, wordLength);
						lineText = lineText.replace("**" + word + "**", `<strong>${word}</strong>`);
					}
					else
					{
						if(wordType == -1)
						{
							wordStart = lineText.substring(i + 2);
							i+=2;
							wordType = 0
						}
					}
				}
				else
				{
					if(wordStart.length != 0 && wordType == 3)
					{
						var word = wordStart.substring(0, wordLength);
						lineText = lineText.replace("*" + word + "*", `<em>${word}</em>`);
					}
					else
					{
						if(wordType == -1)
						{
							wordStart = lineText.substring(i + 1);
							i++;
							wordType = 3
						}
					}
				}
			}
			else if(lineText[i] == '_')
			{
				if(lineText[i + 1] == '_')
				{
					if(wordStart.length != 0 && wordType == 1)
					{
						var word = wordStart.substring(0, wordLength);
						lineText = lineText.replace("__" + word + "__", `<strong>${word}</strong>`);
					}
					else
					{
						if(wordType == -1)
						{
							wordStart = lineText.substring(i + 2);
							i+=2;
							wordType = 1
						}
					}
				}
			}
		}
	}

	return lineText
}

function checkForLink(lineText: string){
	var linkStart = lineText.search("[link]");
	var outLine = "";
	if (linkStart == -1){
		return lineText;
	}

	var linkEnd = -1;

	for(var i = linkStart + 6; i < lineText.length; i++)
	{
		if(lineText[i] == ')')
		{
			linkEnd = i;
		}
	}

	if (linkEnd == -1){
		return lineText;
	}
	if(linkStart > 1)
	{
		outLine += lineText.substring(0, linkStart);
	}
	outLine += `<a href="${lineText.substring(linkStart + 6, linkEnd)}">${lineText.substring(linkStart + 6, linkEnd)}</a>`;
	outLine += lineText.substring(linkEnd + 1, lineText.length);

	lineText = outLine
	
	return lineText; 
}

function checkForImage(lineText: string)
{
	var imgLinkStart = -1;

	for(var i = 0; i < lineText.length - 1; i++)
	{
		if(lineText[i] == '!' && lineText[i + 1] == '[')
		{
			imgLinkStart = i;
		}
	}

	if(imgLinkStart != -1)
	{
		var imgLink = lineText.substring(2);
		var imgLinkEnd = -1;

		for(var i = 0; i < imgLink.length; i++)
		{
			if(imgLink[i] == ']')
			{
				imgLinkEnd = i;
			}
		}

		if(imgLinkEnd != -1)
		{
			var outline = "";
			imgLink = imgLink.substring(0, imgLinkEnd);

			if(imgLinkStart > 1)
			{
				outline += lineText.substring(0, imgLinkStart);
			}
			outline += `<img src="${imgLink}">`;
			if(imgLinkEnd < imgLink.length - 2)
			{
				outline += lineText.substring(imgLinkEnd, lineText.length);
			}
			lineText = outline
		}
	}

	return lineText;
}

function getWebviewContent(code: vscode.TextDocument | undefined)
{
	let htmlText = `<!DOCTYPE html>
	<html lang="en">
	<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Tamara markdown extension</title>
	</head>
	<body style="background-color:white; color:black;">
	<h1>Tamara's trying to markdown\n</h1>`;
	if(code)
	{
		const linesOfCode = code.lineCount;
		for(var i = 0; i < linesOfCode; i++)
		{
			if(code.lineAt(i).text.length != 0)
			{
				var printParagraph = true
				let headingResult = checkForHeadings(code, i);
				i += headingResult[1];
				
				var text = headingResult[0];
				if(text == "")
				{
					text = `<p>${code.lineAt(i).text}</p>`;
				}
				
				text = checkForLink(text);
				text = checkForEmphasis(text);
				text = checkForImage(text);
				htmlText += text
			}
		}
	}

	htmlText += `
	</body>
	</html>`;

	return htmlText;
}

// this method is called when your extension is deactivated
export function deactivate() {}
