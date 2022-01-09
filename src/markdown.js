export function h1(text) {
    return `# ${text}`;
}

export function h2(text) {
    return `## ${text}\n`;
}

export function h3(text) {
    return `### ${text}\n`;
}

export function h4(text) {
    return `#### ${text}\n`;
}

export function h5(text) {
    return `##### ${text}\n`;
}

export function italic(text) {
    return `__${text}__\n`;
}

export function bold(text) {
    return `**${text}**\n`;
}

export function paragraph(text) {
    return `> ${text}\n`;
}

export function paragraphTip(text) {
    return `!> ${text}\n`;
}

export function monospace(text) {
    return "`" + text + "`\n";
}

export function strikethrough(text) {
    return `~~${text}~~\n`;
}

export function bullet(text) {
    return `* ${text}\n`;
}

export function versionPill(text) {
    return `<span class="swgVersion">${text}</span>`;
}

export function verbPill(text) {

    var color = "var(--no-rainbow)";
    switch (text) {
        case 'HEAD':
            color = "var(--rainbow8)";
            break;
        case 'GET':
            color = "var(--rainbow1)";
            break;
        case 'PUT':
            color = "var(--rainbow2)";
            break;
        case 'POST':
            color = "var(--rainbow3)";
            break;
        case 'DELETE':
            color = "var(--rainbow4)";
            break;
        case 'LIST':
            color = "var(--rainbow5)";
            break;
        case 'PATCH':
            color = "var(--rainbow6)";
            break;
        case 'OPTION':
            color = "var(--rainbow7)";
            break;

    }
    return `<span class="swgVerb" style="background-color: ${color};">${text}</span>`;
}


export function BugBug(text) {
    return `<span class="warn">${text}</span>\n`;
}


export function par1(text) {
    return `<p class="swgParagraphH1">${text}</p>\n`;

}

export function par2(text) {
    return `<p class="swgParagraphH2">${text}</p>\n`;
}


export function table(headData, tableData) {
    if (!headData || !tableData || headData.length == 0) {
        return "";
    }

    let tableContent = "|";
    headData.forEach(name => {
        tableContent += ` ${name} |`
    });
    tableContent += "\n";
    tableContent += "| ";
    for (let index = 0; index < headData.length; index++) {
        tableContent += " :------ |";
    }
    tableContent += "\n";
    tableData.forEach(row => {
        tableContent += "|";
        row.forEach(item => {
            tableContent += ` ${resolveUndefined(item)} |`;
        })
        tableContent += "\n";
    });

    return tableContent + "\n";
}

export function codeBlock(lang, code) {
    return "```" + `${lang}\n${code}\n` + "```";
}

export function link(text, url) {
    return `[${text}](${url})`;
}

function resolveUndefined(any) {
    return any != undefined && any != null ? any : "-";
}