"use client";

import { useState, useEffect, useCallback } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import * as Select from "@radix-ui/react-select";
import { ChevronDown, Download, Link2, Loader2, RefreshCw } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// --- Sample Templates ---
const SAMPLES: Record<string, string> = {
  "Software Development Project": `We are building a web application for [CLIENT_COMPANY]. The project involves:
- Custom dashboard with real-time analytics
- User authentication and role management
- API integrations with third-party services
- Mobile-responsive design

Timeline: 3 months
Team: 2 developers, 1 designer`,

  "Marketing Consulting": `We are providing marketing strategy consulting for [CLIENT_COMPANY]. Services include:
- Market research and competitive analysis
- Brand positioning and messaging strategy
- Digital marketing campaign planning
- Monthly performance reviews and reporting

Engagement: 6-month retainer`,

  "Business Strategy": `Strategic advisory services for [CLIENT_COMPANY] covering:
- Business model review and optimization
- Growth strategy development
- Operational efficiency assessment
- Quarterly board presentations

Scope: 90-day intensive engagement`,

  Custom: "",
};

const MODELS = ["claude-sonnet-4-6", "gpt-4o", "gemini-2.0-flash-001"];

const SYSTEM_PROMPT_PRESETS: Record<string, string> = {
  "Professional Consultant":
    "You are a professional business consultant drafting formal proposals and consulting agreements.",
  "Friendly Advisor":
    "You are a friendly and approachable business advisor writing warm yet professional proposals.",
  "Technical Expert":
    "You are a technical expert drafting detailed project proposals with specifications and methodology.",
  Custom: "",
};

interface Config {
  model: string;
  systemPromptPreset: string;
  customSystemPrompt: string;
  logoUrl: string;
  hourlyRate: string;
  projectFee: string;
}

const DEFAULT_CONFIG: Config = {
  model: "claude-sonnet-4-6",
  systemPromptPreset: "Professional Consultant",
  customSystemPrompt: "",
  logoUrl: "",
  hourlyRate: "",
  projectFee: "",
};

export default function ProposalBuilder() {
  // Tab 1 - Input state
  const [content, setContent] = useState("");
  const [selectedSample, setSelectedSample] = useState("Custom");
  const [clientName, setClientName] = useState("");
  const [clientCompany, setClientCompany] = useState("");
  const [clientEmail, setClientEmail] = useState("");

  // Tab 2 - Config state
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);

  // Tab 3 - Output state
  const [proposal, setProposal] = useState("");
  const [tone, setTone] = useState("Balanced");
  const [length, setLength] = useState("Standard");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  // Active tab
  const [activeTab, setActiveTab] = useState("input");

  // Load config from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("proposalcraft-config");
      if (saved) {
        setConfig(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  // Persist config to localStorage
  const updateConfig = useCallback(
    (updates: Partial<Config>) => {
      const next = { ...config, ...updates };
      setConfig(next);
      localStorage.setItem("proposalcraft-config", JSON.stringify(next));
    },
    [config]
  );

  // Handle sample selection
  const handleSampleChange = (value: string) => {
    setSelectedSample(value);
    const template = SAMPLES[value] || "";
    if (template) {
      setContent(template.replace(/\[CLIENT_COMPANY\]/g, clientCompany || "[CLIENT_COMPANY]"));
    }
  };

  // Generate proposal
  const generate = async () => {
    setIsGenerating(true);
    setError("");
    setActiveTab("output");

    try {
      const systemPrompt =
        config.systemPromptPreset === "Custom"
          ? config.customSystemPrompt
          : config.systemPromptPreset;

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          clientInfo: { name: clientName, company: clientCompany, email: clientEmail },
          model: config.model,
          systemPrompt,
          tone,
          length,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate proposal");
      }

      const data = await res.json();
      setProposal(data.proposal);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  // Download PDF
  const downloadPdf = async () => {
    const el = document.getElementById("proposal-output");
    if (!el) return;

    const canvas = await html2canvas(el, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    // Add logo if configured
    if (config.logoUrl) {
      try {
        pdf.addImage(config.logoUrl, "PNG", 10, 10, 40, 15);
      } catch {
        // Logo load failed, skip
      }
    }

    const yOffset = config.logoUrl ? 30 : 10;
    pdf.addImage(imgData, "PNG", 10, yOffset, pdfWidth - 20, pdfHeight - 20);

    // Handle multi-page
    if (pdfHeight > pdf.internal.pageSize.getHeight()) {
      let position = yOffset;
      const pageHeight = pdf.internal.pageSize.getHeight();
      while (position < pdfHeight) {
        if (position > yOffset) {
          pdf.addPage();
        }
        position += pageHeight;
      }
    }

    pdf.save(`proposal-${clientCompany || "draft"}.pdf`);
  };

  // Copy link
  const copyLink = () => {
    const state = {
      content,
      clientName,
      clientCompany,
      clientEmail,
      config,
      tone,
      length,
    };
    const encoded = btoa(JSON.stringify(state));
    const url = `${window.location.origin}?state=${encoded}`;
    navigator.clipboard.writeText(url);
    alert("Link copied to clipboard!");
  };

  // Load state from URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stateParam = params.get("state");
    if (stateParam) {
      try {
        const decoded = JSON.parse(atob(stateParam));
        if (decoded.content) setContent(decoded.content);
        if (decoded.clientName) setClientName(decoded.clientName);
        if (decoded.clientCompany) setClientCompany(decoded.clientCompany);
        if (decoded.clientEmail) setClientEmail(decoded.clientEmail);
        if (decoded.config) setConfig(decoded.config);
        if (decoded.tone) setTone(decoded.tone);
        if (decoded.length) setLength(decoded.length);
      } catch {
        // ignore bad state
      }
    }
  }, []);

  return (
    <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="flex flex-1 flex-col">
      <Tabs.List className="flex border-b border-zinc-200 bg-white px-6">
        {[
          { value: "input", label: "Input" },
          { value: "configure", label: "Configure" },
          { value: "output", label: "Output" },
        ].map((tab) => (
          <Tabs.Trigger
            key={tab.value}
            value={tab.value}
            className="border-b-2 border-transparent px-6 py-3 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 data-[state=active]:border-zinc-900 data-[state=active]:text-zinc-900"
          >
            {tab.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>

      {/* Tab 1: Input */}
      <Tabs.Content value="input" className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700">
              Project Template
            </label>
            <Select.Root value={selectedSample} onValueChange={handleSampleChange}>
              <Select.Trigger className="flex w-full items-center justify-between rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 hover:border-zinc-400">
                <Select.Value />
                <Select.Icon>
                  <ChevronDown className="h-4 w-4 text-zinc-400" />
                </Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Content className="z-50 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg">
                  <Select.Viewport className="p-1">
                    {Object.keys(SAMPLES).map((key) => (
                      <Select.Item
                        key={key}
                        value={key}
                        className="cursor-pointer rounded-md px-3 py-2 text-sm text-zinc-900 outline-none hover:bg-zinc-100 data-[highlighted]:bg-zinc-100"
                      >
                        <Select.ItemText>{key}</Select.ItemText>
                      </Select.Item>
                    ))}
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700">
              Project Details
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Describe your project, services, and scope..."
              className="w-full rounded-lg border border-zinc-300 px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              style={{ minHeight: "200px" }}
            />
          </div>

          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-5">
            <h3 className="mb-4 text-sm font-semibold text-zinc-800">Client Information</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-600">
                  Client Name
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-600">Company</label>
                <input
                  type="text"
                  value={clientCompany}
                  onChange={(e) => setClientCompany(e.target.value)}
                  placeholder="Acme Corp"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-600">Email</label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="john@acme.com"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <button
            onClick={generate}
            disabled={!content.trim() || isGenerating}
            className="w-full rounded-lg bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isGenerating ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </span>
            ) : (
              "Generate Proposal"
            )}
          </button>
        </div>
      </Tabs.Content>

      {/* Tab 2: Configure */}
      <Tabs.Content value="configure" className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700">LLM Model</label>
            <Select.Root
              value={config.model}
              onValueChange={(v) => updateConfig({ model: v })}
            >
              <Select.Trigger className="flex w-full items-center justify-between rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 hover:border-zinc-400">
                <Select.Value />
                <Select.Icon>
                  <ChevronDown className="h-4 w-4 text-zinc-400" />
                </Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Content className="z-50 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg">
                  <Select.Viewport className="p-1">
                    {MODELS.map((m) => (
                      <Select.Item
                        key={m}
                        value={m}
                        className="cursor-pointer rounded-md px-3 py-2 text-sm text-zinc-900 outline-none hover:bg-zinc-100 data-[highlighted]:bg-zinc-100"
                      >
                        <Select.ItemText>{m}</Select.ItemText>
                      </Select.Item>
                    ))}
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700">
              System Prompt Preset
            </label>
            <Select.Root
              value={config.systemPromptPreset}
              onValueChange={(v) => updateConfig({ systemPromptPreset: v })}
            >
              <Select.Trigger className="flex w-full items-center justify-between rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 hover:border-zinc-400">
                <Select.Value />
                <Select.Icon>
                  <ChevronDown className="h-4 w-4 text-zinc-400" />
                </Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Content className="z-50 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg">
                  <Select.Viewport className="p-1">
                    {Object.keys(SYSTEM_PROMPT_PRESETS).map((key) => (
                      <Select.Item
                        key={key}
                        value={key}
                        className="cursor-pointer rounded-md px-3 py-2 text-sm text-zinc-900 outline-none hover:bg-zinc-100 data-[highlighted]:bg-zinc-100"
                      >
                        <Select.ItemText>{key}</Select.ItemText>
                      </Select.Item>
                    ))}
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>

            {config.systemPromptPreset === "Custom" && (
              <textarea
                value={config.customSystemPrompt}
                onChange={(e) => updateConfig({ customSystemPrompt: e.target.value })}
                placeholder="Write your custom system prompt..."
                className="mt-3 w-full rounded-lg border border-zinc-300 px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                rows={4}
              />
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700">Your Logo URL</label>
            <input
              type="url"
              value={config.logoUrl}
              onChange={(e) => updateConfig({ logoUrl: e.target.value })}
              placeholder="https://example.com/logo.png"
              className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Hourly Rate ($)
              </label>
              <input
                type="number"
                value={config.hourlyRate}
                onChange={(e) => updateConfig({ hourlyRate: e.target.value })}
                placeholder="150"
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700">
                Project Fee ($)
              </label>
              <input
                type="number"
                value={config.projectFee}
                onChange={(e) => updateConfig({ projectFee: e.target.value })}
                placeholder="25000"
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none"
              />
            </div>
          </div>

          <p className="text-xs text-zinc-400">
            Settings are automatically saved to your browser.
          </p>
        </div>
      </Tabs.Content>

      {/* Tab 3: Output */}
      <Tabs.Content value="output" className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-3xl space-y-4">
          {/* Tweak controls */}
          <div className="flex flex-wrap items-center gap-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-zinc-600">Tone:</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900"
              >
                <option>Formal</option>
                <option>Balanced</option>
                <option>Friendly</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-zinc-600">Length:</label>
              <select
                value={length}
                onChange={(e) => setLength(e.target.value)}
                className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900"
              >
                <option>Brief</option>
                <option>Standard</option>
                <option>Detailed</option>
              </select>
            </div>

            <button
              onClick={generate}
              disabled={isGenerating || !content.trim()}
              className="flex items-center gap-1.5 rounded-md bg-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-300 disabled:opacity-50"
            >
              <RefreshCw className="h-3 w-3" />
              Re-generate
            </button>

            <div className="ml-auto flex gap-2">
              <button
                onClick={downloadPdf}
                disabled={!proposal}
                className="flex items-center gap-1.5 rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
              >
                <Download className="h-3 w-3" />
                Download PDF
              </button>
              <button
                onClick={copyLink}
                className="flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
              >
                <Link2 className="h-3 w-3" />
                Copy Link
              </button>
            </div>
          </div>

          {/* Output area */}
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
              <p className="text-sm text-zinc-500">Generating your proposal...</p>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          ) : proposal ? (
            <div
              id="proposal-output"
              contentEditable
              suppressContentEditableWarning
              className="min-h-[400px] rounded-lg border border-zinc-200 bg-white p-6 text-sm leading-relaxed text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              style={{ whiteSpace: "pre-wrap" }}
            >
              {proposal}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-20 text-zinc-400">
              <p className="text-sm">No proposal generated yet.</p>
              <p className="text-xs">
                Go to the Input tab and click &quot;Generate Proposal&quot; to get started.
              </p>
            </div>
          )}
        </div>
      </Tabs.Content>
    </Tabs.Root>
  );
}
