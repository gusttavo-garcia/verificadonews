import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { generateAndUploadImage } from "@/lib/ai-image";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Highlighter,
  List,
  ListOrdered,
  Quote,
  Minus,
  Link2,
  Link2Off,
  Undo2,
  Redo2,
  Eraser,
  ImagePlus,
  Sparkles,
  Loader2,
  Images,
} from "lucide-react";
import { PexelsPicker } from "@/components/site/pexels-picker";

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  /** Modelo de imagem configurado em Integrações */
  imageModel?: string;
  /** Habilita o botão de gerar imagem com IA */
  aiImageEnabled?: boolean;
};

async function uploadToStorage(file: File) {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `conteudo/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("article-images")
    .upload(path, file, { cacheControl: "31536000" });
  if (error) throw error;
  const { data: signed, error: sErr } = await supabase.storage
    .from("article-images")
    .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
  if (sErr || !signed) throw sErr ?? new Error("URL falhou");
  return signed.signedUrl;
}

function ToolButton({
  active,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm font-medium transition ${
        active
          ? "bg-primary text-primary-foreground"
          : "text-foreground/80 hover:bg-accent hover:text-accent-foreground"
      }`}
    >
      {children}
    </button>
  );
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  imageModel,
  aiImageEnabled = true,
}: Props) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState<null | "upload" | "ai">(null);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: { openOnClick: false, autolink: true },
      }),
      Highlight,
      Image.configure({ HTMLAttributes: { class: "rounded-lg" } }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class:
          "editor-content max-w-none min-h-[70vh] px-5 py-4 text-base focus:outline-none",
        "data-placeholder": placeholder ?? "",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  // Sync external value changes (e.g. loading an article) without losing focus.
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value !== current && !editor.isFocused) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [value, editor]);

  if (!editor) {
    return (
      <div className="min-h-[470px] rounded-lg border border-border bg-muted/30" />
    );
  }

  const setLink = () => {
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Endereço do link (URL):", previous ?? "https://");
    if (url === null) return;
    if (url.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url.trim() })
      .run();
  };

  const insertUploadedImage = async (file: File) => {
    if (!file.type.startsWith("image/")) return toast.error("Selecione uma imagem.");
    if (file.size > 5 * 1024 * 1024) return toast.error("Imagem muito grande (máx. 5 MB).");
    setBusy("upload");
    try {
      const url = await uploadToStorage(file);
      editor.chain().focus().setImage({ src: url, alt: file.name }).run();
      toast.success("Imagem inserida no conteúdo.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha no upload");
    } finally {
      setBusy(null);
    }
  };

  const insertAiImage = async () => {
    const prompt = window.prompt("Descreva a imagem que a IA deve criar:");
    if (!prompt || prompt.trim().length < 3) return;
    setBusy("ai");
    try {
      const url = await generateAndUploadImage(prompt.trim(), imageModel);
      editor.chain().focus().setImage({ src: url, alt: prompt.trim() }).run();
      toast.success("Imagem gerada e inserida.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao gerar imagem");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-background">
      <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/40 p-2">
        <ToolButton
          title="Parágrafo"
          active={editor.isActive("paragraph")}
          onClick={() => editor.chain().focus().setParagraph().run()}
        >
          P
        </ToolButton>
        {[1, 2, 3].map((level) => (
          <ToolButton
            key={level}
            title={`Título H${level}`}
            active={editor.isActive("heading", { level })}
            onClick={() =>
              editor
                .chain()
                .focus()
                .toggleHeading({ level: level as 1 | 2 | 3 })
                .run()
            }
          >
            H{level}
          </ToolButton>
        ))}
        <span className="mx-1 h-5 w-px bg-border" />
        <ToolButton
          title="Negrito"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </ToolButton>
        <ToolButton
          title="Itálico"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </ToolButton>
        <ToolButton
          title="Sublinhado"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="h-4 w-4" />
        </ToolButton>
        <ToolButton
          title="Tachado"
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="h-4 w-4" />
        </ToolButton>
        <ToolButton
          title="Grifado"
          active={editor.isActive("highlight")}
          onClick={() => editor.chain().focus().toggleHighlight().run()}
        >
          <Highlighter className="h-4 w-4" />
        </ToolButton>
        <span className="mx-1 h-5 w-px bg-border" />
        <ToolButton
          title="Lista com marcadores"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </ToolButton>
        <ToolButton
          title="Lista numerada"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </ToolButton>
        <ToolButton
          title="Citação"
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="h-4 w-4" />
        </ToolButton>
        <ToolButton
          title="Linha divisória"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus className="h-4 w-4" />
        </ToolButton>
        <span className="mx-1 h-5 w-px bg-border" />
        <ToolButton title="Inserir link" active={editor.isActive("link")} onClick={setLink}>
          <Link2 className="h-4 w-4" />
        </ToolButton>
        <ToolButton
          title="Remover link"
          onClick={() => editor.chain().focus().extendMarkRange("link").unsetLink().run()}
        >
          <Link2Off className="h-4 w-4" />
        </ToolButton>
        <span className="mx-1 h-5 w-px bg-border" />
        <ToolButton
          title="Inserir imagem do computador"
          onClick={() => fileRef.current?.click()}
        >
          {busy === "upload" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ImagePlus className="h-4 w-4" />
          )}
        </ToolButton>
        {aiImageEnabled && (
          <ToolButton title="Gerar imagem com IA" onClick={() => void insertAiImage()}>
            {busy === "ai" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
          </ToolButton>
        )}
        <ToolButton
          title="Limpar formatação"
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
        >
          <Eraser className="h-4 w-4" />
        </ToolButton>
        <span className="mx-1 h-5 w-px bg-border" />
        <ToolButton title="Desfazer" onClick={() => editor.chain().focus().undo().run()}>
          <Undo2 className="h-4 w-4" />
        </ToolButton>
        <ToolButton title="Refazer" onClick={() => editor.chain().focus().redo().run()}>
          <Redo2 className="h-4 w-4" />
        </ToolButton>
        <span className="ml-auto pr-1 text-xs text-muted-foreground">
          {editor.getText().length.toLocaleString()} caracteres
        </span>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) void insertUploadedImage(f);
        }}
      />
      <EditorContent editor={editor} />
    </div>
  );
}
