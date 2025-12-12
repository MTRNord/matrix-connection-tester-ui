interface CodeBlockProps {
  children: string;
  language?:
    | "json"
    | "toml"
    | "nginx"
    | "caddy"
    | "apache"
    | "bash"
    | "yaml"
    | "dns"
    | "javascript"
    | "js"
    | "http"
    | "sql"
    | "securitytxt"
    | "text";
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
    case "apache":
      return highlightApache(code);
    case "bash":
      return highlightBash(code);
    case "yaml":
      return highlightYAML(code);
    case "dns":
      return highlightDNS(code);
    case "javascript":
    case "js":
      return highlightJavaScript(code);
    case "http":
      return highlightHTTP(code);
    case "sql":
      return highlightSQL(code);
    case "securitytxt":
      return highlightSecurityTxt(code);
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

function highlightYAML(code: string): string {
  const lines = code.split("\n");
  const highlighted = lines.map((line) => {
    // Full line comment
    if (/^\s*#/.test(line)) {
      return `<span class="comment">${escapeHtml(line)}</span>`;
    }

    let result = "";
    const colonIndex = line.indexOf(":");

    if (colonIndex !== -1) {
      // Key: value line
      const keyPart = line.substring(0, colonIndex);
      const valuePart = line.substring(colonIndex);

      // Highlight the key
      const key = keyPart.trim();
      const leadingSpace = keyPart.substring(0, keyPart.indexOf(key));
      result += escapeHtml(leadingSpace);
      result += `<span class="property">${escapeHtml(key)}</span>`;
      result += escapeHtml(":");

      // Process the value
      const afterColon = valuePart.substring(1); // Everything after the colon
      const valueContent = afterColon.trim();
      const valueStartIndex = afterColon.indexOf(valueContent);
      const valueLeadingSpace = afterColon.substring(0, valueStartIndex);
      result += escapeHtml(valueLeadingSpace);

      // String values in quotes
      if (valueContent.startsWith('"') || valueContent.startsWith("'")) {
        result += `<span class="string">${escapeHtml(valueContent)}</span>`;
      } // Boolean values
      else if (valueContent === "true" || valueContent === "false") {
        result += `<span class="keyword">${escapeHtml(valueContent)}</span>`;
      } // Number values
      else if (/^-?\d+\.?\d*$/.test(valueContent)) {
        result += `<span class="number">${escapeHtml(valueContent)}</span>`;
      } // null/~ values
      else if (
        valueContent === "null" || valueContent === "~" || valueContent === ""
      ) {
        result += `<span class="keyword">${escapeHtml(valueContent)}</span>`;
      } // Everything else
      else {
        result += escapeHtml(valueContent);
      }

      return result;
    }

    // List items
    if (/^\s*-\s/.test(line)) {
      const dashIndex = line.indexOf("-");
      const leadingSpace = line.substring(0, dashIndex);
      const afterDash = line.substring(dashIndex + 1);
      result += escapeHtml(leadingSpace);
      result += escapeHtml("-");

      const content = afterDash.trim();
      const contentLeadingSpace = afterDash.substring(
        0,
        afterDash.indexOf(content),
      );
      result += escapeHtml(contentLeadingSpace);

      // Highlight list item content
      if (content.startsWith('"') || content.startsWith("'")) {
        result += `<span class="string">${escapeHtml(content)}</span>`;
      } else if (/^-?\d+\.?\d*$/.test(content)) {
        result += `<span class="number">${escapeHtml(content)}</span>`;
      } else {
        result += escapeHtml(content);
      }

      return result;
    }

    // Default: just escape
    return escapeHtml(line);
  });

  return highlighted.join("\n");
}

function highlightDNS(code: string): string {
  const lines = code.split("\n");
  const highlighted = lines.map((line) => {
    // Full line comment
    if (/^\s*;/.test(line)) {
      return `<span class="comment">${escapeHtml(line)}</span>`;
    }

    let result = "";
    const tokens = line.split(/(\s+)/);

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      // Whitespace
      if (/^\s+$/.test(token)) {
        result += escapeHtml(token);
        continue;
      }

      // Domain names (first token typically)
      if (i === 0 && /^[a-zA-Z0-9._-]+\.?$/.test(token)) {
        result += `<span class="property">${escapeHtml(token)}</span>`;
        continue;
      }

      // Record types (A, AAAA, CNAME, MX, TXT, SRV, etc.)
      if (/^(A|AAAA|CNAME|MX|TXT|SRV|NS|PTR|SOA|CAA|IN)$/i.test(token)) {
        result += `<span class="keyword">${escapeHtml(token)}</span>`;
        continue;
      }

      // Numbers (TTL, priority, weight, port)
      if (/^\d+$/.test(token)) {
        result += `<span class="number">${escapeHtml(token)}</span>`;
        continue;
      }

      // IP addresses
      if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(token)) {
        result += `<span class="string">${escapeHtml(token)}</span>`;
        continue;
      }

      // Quoted strings
      if (token.startsWith('"') && token.endsWith('"')) {
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

function highlightApache(code: string): string {
  const lines = code.split("\n");
  const highlighted = lines.map((line) => {
    // Comments
    if (line.trim().startsWith("#")) {
      return `<span class="comment">${escapeHtml(line)}</span>`;
    }

    let result = "";

    // Apache directives (VirtualHost, Directory, Location, etc.)
    if (/<\/?[A-Za-z]+/.test(line)) {
      result = line.replace(
        /(<\/?[A-Za-z]+[^>]*>)/g,
        (match) => `<span class="keyword">${escapeHtml(match)}</span>`,
      );
      return result;
    }

    // Directives (ServerName, DocumentRoot, etc.)
    const directiveMatch = line.match(/^(\s*)([A-Z][A-Za-z]+)(\s+)(.+)$/);
    if (directiveMatch) {
      const [, indent, directive, space, value] = directiveMatch;
      result = escapeHtml(indent) +
        `<span class="keyword">${escapeHtml(directive)}</span>` +
        escapeHtml(space);

      // Highlight quoted strings in value
      const valueParts = value.split(/("[^"]*")/);
      valueParts.forEach((part, i) => {
        if (i % 2 === 1) {
          result += `<span class="string">${escapeHtml(part)}</span>`;
        } else {
          result += escapeHtml(part);
        }
      });

      return result;
    }

    return escapeHtml(line);
  });

  return highlighted.join("\n");
}

function highlightJavaScript(code: string): string {
  const lines = code.split("\n");
  const highlighted = lines.map((line) => {
    // Comments
    if (line.trim().startsWith("//")) {
      return `<span class="comment">${escapeHtml(line)}</span>`;
    }

    let result = "";
    let i = 0;

    while (i < line.length) {
      // Strings
      if (line[i] === '"' || line[i] === "'" || line[i] === "`") {
        const quote = line[i];
        let str = quote;
        let j = i + 1;
        while (j < line.length && line[j] !== quote) {
          if (line[j] === "\\") {
            str += line[j] + (line[j + 1] || "");
            j += 2;
          } else {
            str += line[j];
            j++;
          }
        }
        if (j < line.length) str += line[j];
        result += `<span class="string">${escapeHtml(str)}</span>`;
        i = j + 1;
        continue;
      }

      // Keywords
      const keywords =
        /^(import|from|const|let|var|function|return|if|else|for|while|export|default|async|await|class|new|this|try|catch|throw)\b/;
      const keywordMatch = line.substring(i).match(keywords);
      if (keywordMatch) {
        result += `<span class="keyword">${escapeHtml(keywordMatch[0])}</span>`;
        i += keywordMatch[0].length;
        continue;
      }

      // Function calls
      const funcMatch = line.substring(i).match(
        /^([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/,
      );
      if (funcMatch) {
        result += `<span class="function">${escapeHtml(funcMatch[1])}</span>`;
        i += funcMatch[1].length;
        continue;
      }

      // Numbers
      const numMatch = line.substring(i).match(/^[0-9]+(\.[0-9]+)?/);
      if (numMatch) {
        result += `<span class="number">${escapeHtml(numMatch[0])}</span>`;
        i += numMatch[0].length;
        continue;
      }

      result += escapeHtml(line[i]);
      i++;
    }

    return result;
  });

  return highlighted.join("\n");
}

function highlightHTTP(code: string): string {
  const lines = code.split("\n");
  const highlighted = lines.map((line) => {
    // HTTP request/response line (GET, POST, HTTP/1.1, etc.)
    if (/^(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS|HTTP\/\d\.\d)/i.test(line)) {
      return `<span class="keyword">${escapeHtml(line)}</span>`;
    }

    // Headers (Key: Value)
    const colonIndex = line.indexOf(":");
    if (colonIndex > 0 && colonIndex < line.length - 1) {
      const key = line.substring(0, colonIndex);
      const value = line.substring(colonIndex);

      return `<span class="property">${escapeHtml(key)}</span>${
        escapeHtml(value)
      }`;
    }

    // Empty lines or body content
    return escapeHtml(line);
  });

  return highlighted.join("\n");
}

function highlightSQL(code: string): string {
  const lines = code.split("\n");
  const highlighted = lines.map((line) => {
    let result = "";
    let i = 0;

    // Skip leading whitespace
    while (i < line.length && /\s/.test(line[i])) {
      result += line[i];
      i++;
    }

    // Process the rest of the line
    while (i < line.length) {
      const char = line[i];

      // String literals (single quotes)
      if (char === "'") {
        let str = "'";
        i++;
        while (i < line.length && line[i] !== "'") {
          if (line[i] === "\\" && i + 1 < line.length) {
            str += line[i] + line[i + 1];
            i += 2;
          } else {
            str += line[i];
            i++;
          }
        }
        if (i < line.length) {
          str += "'";
          i++;
        }
        result += `<span class="string">${escapeHtml(str)}</span>`;
        continue;
      }

      // Comments (-- or #)
      if (
        (char === "-" && i + 1 < line.length && line[i + 1] === "-") ||
        char === "#"
      ) {
        result += `<span class="comment">${
          escapeHtml(line.substring(i))
        }</span>`;
        break;
      }

      // SQL keywords
      const keywords = [
        "SELECT",
        "FROM",
        "WHERE",
        "INSERT",
        "INTO",
        "VALUES",
        "UPDATE",
        "SET",
        "DELETE",
        "CREATE",
        "DROP",
        "ALTER",
        "TABLE",
        "DATABASE",
        "INDEX",
        "VIEW",
        "USER",
        "WITH",
        "AS",
        "ON",
        "AND",
        "OR",
        "NOT",
        "NULL",
        "PRIMARY",
        "KEY",
        "FOREIGN",
        "REFERENCES",
        "CONSTRAINT",
        "UNIQUE",
        "CHECK",
        "DEFAULT",
        "AUTO_INCREMENT",
        "IDENTITY",
        "GRANT",
        "REVOKE",
        "JOIN",
        "LEFT",
        "RIGHT",
        "INNER",
        "OUTER",
        "FULL",
        "CROSS",
        "UNION",
        "INTERSECT",
        "EXCEPT",
        "ORDER",
        "BY",
        "GROUP",
        "HAVING",
        "LIMIT",
        "OFFSET",
        "DISTINCT",
        "ALL",
        "EXISTS",
        "IN",
        "LIKE",
        "BETWEEN",
        "IS",
        "CASE",
        "WHEN",
        "THEN",
        "ELSE",
        "END",
        "IF",
        "BEGIN",
        "COMMIT",
        "ROLLBACK",
        "TRANSACTION",
        "ENCODING",
        "LC_COLLATE",
        "LC_CTYPE",
        "TEMPLATE",
        "OWNER",
        "PASSWORD",
      ];

      const keywordMatch = keywords.find((kw) =>
        line.substring(i).toUpperCase().startsWith(kw) &&
        (i + kw.length >= line.length ||
          !/[a-zA-Z0-9_]/.test(line[i + kw.length]))
      );

      if (keywordMatch) {
        result += `<span class="keyword">${
          escapeHtml(line.substring(i, i + keywordMatch.length))
        }</span>`;
        i += keywordMatch.length;
        continue;
      }

      // Numbers
      if (/\d/.test(char)) {
        let num = "";
        while (i < line.length && /[\d.]/.test(line[i])) {
          num += line[i];
          i++;
        }
        result += `<span class="number">${escapeHtml(num)}</span>`;
        continue;
      }

      // Regular characters
      result += escapeHtml(char);
      i++;
    }

    return result;
  });

  return highlighted.join("\n");
}

function highlightSecurityTxt(code: string): string {
  const lines = code.split("\n");
  const highlighted = lines.map((line) => {
    // Empty lines
    if (line.trim() === "") {
      return "";
    }

    // Comments (lines starting with #)
    if (line.trim().startsWith("#")) {
      return `<span class="comment">${escapeHtml(line)}</span>`;
    }

    // Field: value format
    const colonIndex = line.indexOf(":");
    if (colonIndex > 0) {
      const field = line.substring(0, colonIndex);
      const value = line.substring(colonIndex + 1);

      // Known security.txt fields
      const knownFields = [
        "Contact",
        "Expires",
        "Encryption",
        "Acknowledgments",
        "Preferred-Languages",
        "Canonical",
        "Policy",
        "Hiring",
      ];

      const isKnownField = knownFields.some((f) =>
        field.trim().toLowerCase() === f.toLowerCase()
      );

      if (isKnownField) {
        return `<span class="property">${escapeHtml(field)}</span>:${
          escapeHtml(value)
        }`;
      }
    }

    // Regular line
    return escapeHtml(line);
  });

  return highlighted.join("\n");
}
