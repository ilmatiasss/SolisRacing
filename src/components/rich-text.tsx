import { cn } from "@/lib/cn";

type Block = { type: "p"; text: string } | { type: "ul"; items: string[] };

/** Convierte texto plano del panel en párrafos y listas ("- item"). No interpreta HTML. */
export function parseRichText(text: string): Block[] {
  const blocks: Block[] = [];
  for (const chunk of text.replace(/\r\n/g, "\n").split(/\n{2,}/)) {
    const lines = chunk.split("\n").map((line) => line.trim()).filter(Boolean);
    if (lines.length === 0) continue;
    let paragraph: string[] = [];
    let list: string[] = [];
    const flushParagraph = () => {
      if (paragraph.length) blocks.push({ type: "p", text: paragraph.join(" ") });
      paragraph = [];
    };
    const flushList = () => {
      if (list.length) blocks.push({ type: "ul", items: list });
      list = [];
    };
    for (const line of lines) {
      const bullet = line.match(/^[-*•]\s+(.*)$/);
      if (bullet) {
        flushParagraph();
        list.push(bullet[1]);
      } else {
        flushList();
        paragraph.push(line);
      }
    }
    flushParagraph();
    flushList();
  }
  return blocks;
}

export function RichText({ text, className }: { text: string; className?: string }) {
  const blocks = parseRichText(text);
  return (
    <div className={cn("space-y-3 leading-relaxed", className)}>
      {blocks.map((block, index) =>
        block.type === "p" ? (
          <p key={index}>{block.text}</p>
        ) : (
          <ul key={index} className="space-y-1.5">
            {block.items.map((item, i) => (
              <li key={i} className="flex gap-2.5">
                <span className="mt-2.5 h-0.5 w-2.5 shrink-0 bg-brand-600" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ),
      )}
    </div>
  );
}
