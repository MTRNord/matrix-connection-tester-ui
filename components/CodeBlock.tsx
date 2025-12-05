interface CodeBlockProps {
  children: string;
  language?: "json" | "toml" | "nginx" | "caddy" | "bash" | "text";
}

export default function CodeBlock(
  { children, language = "text" }: CodeBlockProps,
) {
  const highlightedCode = highlightSyntax(children.trim(), language);

  return (
    <pre class="code-block">
      <code dangerouslySetInnerHTML={{ __html: highlightedCode }} />
    </pre>
  );
}

function highlightSyntax(code: string, language: string): string {
  switch (language) {
    case "json":
      return highlightJSON(code);
    case "toml":
      return highlightTOML(code);
    case "nginx":
      return highlightNginx(code);
    case "caddy":
      return highlightCaddy(code);
    case "bash":
      return highlightBash(code);
    default:
      return escapeHtml(code);
  }
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

function highlightJSON(code: string): string {
  // Create tokens to prevent overlapping replacements
  const tokens: Array<{ type: string; value: string }> = [];
  let result = "";

  // Process character by character
  let i = 0;
  while (i < code.length) {
    const char = code[i];

    // String detection
    if (char === '"') {
      let str = '"';
      i++;
      while (i < code.length && code[i] !== '"') {
        if (code[i] === "\\") {
          str += code[i] + (code[i + 1] || "");
          i += 2;
        } else {
          str += code[i];
          i++;
        }
      }
      if (i < code.length) str += '"';
      i++;

      // Check if this is a property name (followed by colon)
      let j = i;
      while (j < code.length && /\s/.test(code[j])) j++;
      if (code[j] === ":") {
        tokens.push({ type: "property", value: str });
      } else {
        tokens.push({ type: "string", value: str });
      }
      continue;
    }

    // Number detection
    if (/[\d-]/.test(char) && (i === 0 || /[\s:,\[]/.test(code[i - 1]))) {
      let num = "";
      while (i < code.length && /[\d.eE+-]/.test(code[i])) {
        num += code[i];
        i++;
      }
      if (/^-?\d+\.?\d*(e[+-]?\d+)?$/i.test(num)) {
        tokens.push({ type: "number", value: num });
        continue;
      } else {
        tokens.push({ type: "text", value: num });
        continue;
      }
    }

    // Boolean and null detection
    if (/[a-z]/.test(char)) {
      let word = "";
      while (i < code.length && /[a-z]/.test(code[i])) {
        word += code[i];
        i++;
      }
      if (word === "true" || word === "false" || word === "null") {
        tokens.push({ type: "keyword", value: word });
        continue;
      } else {
        tokens.push({ type: "text", value: word });
        continue;
      }
    }

    // Everything else
    tokens.push({ type: "text", value: char });
    i++;
  }

  // Build HTML from tokens
  for (const token of tokens) {
    const escaped = escapeHtml(token.value);
    if (token.type === "text") {
      result += escaped;
    } else {
      result += `<span class="${token.type}">${escaped}</span>`;
    }
  }

  return result;
}

function highlightTOML(code: string): string {
  const lines = code.split("\n");
  const highlighted = lines.map((line) => {
    // Full line comment
    if (/^\s*#/.test(line)) {
      return `<span class="comment">${escapeHtml(line)}</span>`;
    }

    let result = "";
    let i = 0;

    // Section header
    if (/^\s*\[/.test(line)) {
      while (i < line.length && line[i] !== "[") {
        result += escapeHtml(line[i]);
        i++;
      }
      result += '<span class="keyword">[</span>';
      i++;
      let section = "";
      while (i < line.length && line[i] !== "]") {
        section += line[i];
        i++;
      }
      result += `<span class="property">${escapeHtml(section)}</span>`;
      if (i < line.length) {
        result += '<span class="keyword">]</span>';
        i++;
      }
      result += escapeHtml(line.substring(i));
      return result;
    }

    // Key = value line
    const eqIndex = line.indexOf("=");
    if (eqIndex !== -1) {
      // Key part
      const keyPart = line.substring(0, eqIndex);
      const key = keyPart.trim();
      result += escapeHtml(keyPart.substring(0, keyPart.indexOf(key)));
      result += `<span class="property">${escapeHtml(key)}</span>`;
      result += escapeHtml(
        keyPart.substring(keyPart.indexOf(key) + key.length),
      );
      result += escapeHtml("=");

      // Value part
      const valuePart = line.substring(eqIndex + 1);
      const trimmedValue = valuePart.trim();

      // String value
      if (trimmedValue.startsWith('"')) {
        const beforeQuote = valuePart.substring(0, valuePart.indexOf('"'));
        result += escapeHtml(beforeQuote);
        const endQuote = valuePart.indexOf('"', valuePart.indexOf('"') + 1);
        if (endQuote !== -1) {
          const str = valuePart.substring(valuePart.indexOf('"'), endQuote + 1);
          result += `<span class="string">${escapeHtml(str)}</span>`;
          result += escapeHtml(valuePart.substring(endQuote + 1));
        } else {
          result += escapeHtml(valuePart);
        }
      } else if (/^-?\d+\.?\d*$/.test(trimmedValue)) {
        // Number value
        const beforeNum = valuePart.substring(
          0,
          valuePart.indexOf(trimmedValue),
        );
        result += escapeHtml(beforeNum);
        result += `<span class="number">${escapeHtml(trimmedValue)}</span>`;
        result += escapeHtml(
          valuePart.substring(
            valuePart.indexOf(trimmedValue) + trimmedValue.length,
          ),
        );
      } else if (trimmedValue === "true" || trimmedValue === "false") {
        // Boolean value
        const beforeBool = valuePart.substring(
          0,
          valuePart.indexOf(trimmedValue),
        );
        result += escapeHtml(beforeBool);
        result += `<span class="keyword">${escapeHtml(trimmedValue)}</span>`;
        result += escapeHtml(
          valuePart.substring(
            valuePart.indexOf(trimmedValue) + trimmedValue.length,
          ),
        );
      } else {
        result += escapeHtml(valuePart);
      }

      return result;
    }

    // Default: just escape
    return escapeHtml(line);
  });

  return highlighted.join("\n");
}

function highlightNginx(code: string): string {
  const lines = code.split("\n");
  const highlighted = lines.map((line) => {
    // Full line comment
    if (/^\s*#/.test(line)) {
      return `<span class="comment">${escapeHtml(line)}</span>`;
    }

    // Tokenize the line more carefully
    let result = "";
    const tokens = tokenizeLine(line);

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      // Check if it's a directive at the start
      if (
        i === 0 || (i > 0 && tokens[i - 1].trim() === "")
      ) {
        if (/^(location|if|add_header|default_type|return)$/.test(token)) {
          result += `<span class="keyword">${escapeHtml(token)}</span>`;
          continue;
        }
      }

      // Variables
      if (token.startsWith("$")) {
        result += `<span class="variable">${escapeHtml(token)}</span>`;
        continue;
      }

      // Strings in quotes
      if (
        (token.startsWith('"') && token.endsWith('"')) ||
        (token.startsWith("'") && token.endsWith("'"))
      ) {
        result += `<span class="string">${escapeHtml(token)}</span>`;
        continue;
      }

      // Paths
      if (/^\/[^\s;{]*/.test(token)) {
        result += `<span class="string">${escapeHtml(token)}</span>`;
        continue;
      }

      // Numbers
      if (/^\d+$/.test(token)) {
        result += `<span class="number">${escapeHtml(token)}</span>`;
        continue;
      }

      // Default
      result += escapeHtml(token);
    }

    return result;
  });

  return highlighted.join("\n");
}

function highlightCaddy(code: string): string {
  const lines = code.split("\n");
  const highlighted = lines.map((line) => {
    // Full line comment
    if (/^\s*#/.test(line)) {
      return `<span class="comment">${escapeHtml(line)}</span>`;
    }

    let result = "";
    const tokens = tokenizeLine(line);

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      // Check if it's a directive at the start
      if (i === 0 || (i > 0 && tokens[i - 1].trim() === "")) {
        if (
          /^(handle|header|respond|route|reverse_proxy|file_server)$/.test(
            token,
          )
        ) {
          result += `<span class="keyword">${escapeHtml(token)}</span>`;
          continue;
        }
      }

      // Strings in quotes
      if (
        (token.startsWith('"') && token.endsWith('"')) ||
        (token.startsWith("'") && token.endsWith("'"))
      ) {
        result += `<span class="string">${escapeHtml(token)}</span>`;
        continue;
      }

      // Paths
      if (/^\/[^\s{]*/.test(token)) {
        result += `<span class="string">${escapeHtml(token)}</span>`;
        continue;
      }

      // Numbers
      if (/^\d+$/.test(token)) {
        result += `<span class="number">${escapeHtml(token)}</span>`;
        continue;
      }

      // Default
      result += escapeHtml(token);
    }

    return result;
  });

  return highlighted.join("\n");
}

function highlightBash(code: string): string {
  const lines = code.split("\n");
  const highlighted = lines.map((line) => {
    // Full line comment
    if (/^\s*#/.test(line)) {
      return `<span class="comment">${escapeHtml(line)}</span>`;
    }

    let result = "";
    const tokens = tokenizeLine(line);

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      // First token is usually the command
      if (i === 0 && /^[a-zA-Z_-]+$/.test(token)) {
        result += `<span class="function">${escapeHtml(token)}</span>`;
        continue;
      }

      // Flags
      if (/^-[a-zA-Z0-9-]+$/.test(token)) {
        result += `<span class="keyword">${escapeHtml(token)}</span>`;
        continue;
      }

      // Strings in quotes
      if (
        (token.startsWith('"') && token.endsWith('"')) ||
        (token.startsWith("'") && token.endsWith("'"))
      ) {
        result += `<span class="string">${escapeHtml(token)}</span>`;
        continue;
      }

      // Paths
      if (/^\/[^\s]*/.test(token) || /^\.[\/.]/.test(token)) {
        result += `<span class="string">${escapeHtml(token)}</span>`;
        continue;
      }

      // Default
      result += escapeHtml(token);
    }

    return result;
  });

  return highlighted.join("\n");
}

function tokenizeLine(line: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let inQuote = false;
  let quoteChar = "";

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (inQuote) {
      current += char;
      if (char === quoteChar && (i === 0 || line[i - 1] !== "\\")) {
        tokens.push(current);
        current = "";
        inQuote = false;
        quoteChar = "";
      }
    } else {
      if (char === '"' || char === "'") {
        if (current) {
          tokens.push(current);
          current = "";
        }
        inQuote = true;
        quoteChar = char;
        current = char;
      } else if (/\s/.test(char)) {
        if (current) {
          tokens.push(current);
          current = "";
        }
        tokens.push(char);
      } else if (/[;{}()]/.test(char)) {
        if (current) {
          tokens.push(current);
          current = "";
        }
        tokens.push(char);
      } else {
        current += char;
      }
    }
  }

  if (current) {
    tokens.push(current);
  }

  return tokens;
}
