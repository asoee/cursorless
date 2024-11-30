import {
  Disposable,
  EditableTextEditor,
  IDE,
  InMemoryTextDocument,
  Notifier,
  OpenUntitledTextDocumentOptions,
  Range,
  RunMode,
  TextDocumentChangeEvent,
  TextEditor,
  WorkspaceFolder,
} from "@cursorless/common";
import type {
  Event,
  FlashDescriptor,
  GeneralizedRange,
  QuickPickOptions,
  TextDocument,
  TextDocumentContentChangeEvent,
  TextEditorSelectionChangeEvent,
  TextEditorVisibleRangesChangeEvent,
} from "@cursorless/common";
import { pull } from "lodash";
// import type { Buffer, JetbrainsClient, Window } from "jetbrains";
// import { v4 as uuid } from "uuid";
import { JetbrainsCapabilities } from "./JetbrainsCapabilities";
// import JetbrainsClipboard from "./JetbrainsClipboard";
// import JetbrainsConfiguration from "./JetbrainsConfiguration";
// import JetbrainsKeyValueStore from "./JetbrainsKeyValueStore";
// import JetbrainsMessages from "./JetbrainsMessages";
// import { JetbrainsTextEditorImpl } from "./JetbrainsTextEditorImpl";
// import path from "path";
// import { nodeGetRunMode } from "@cursorless/node-common";

import {
  fromJetbrainsContentChange,
  jetbrainsOnDidOpenTextDocument,
} from "./JetbrainsEvents";

import type { JetbrainsClient } from "./JetbrainsClient";
import { JetbrainsClipboard } from "./JetbrainsClipboard";
import { JetbrainsConfiguration } from "./JetbrainsConfiguration";
import { JetbrainsMessages } from "./JetbrainsMessages";
import { JetbrainsKeyValueStore } from "./JetbrainsKeyValueStore";
import type { EditorState } from "../types/types";
import { URI } from "vscode-uri";
import { createSelection, createTextEditor } from "./createTextEditor";
import { JetbrainsEditor } from "./JetbrainsEditor";
import { makeNodePairSelection } from "../../../cursorless-engine/src/util/nodeSelectors";
import { elseIfExtractor } from "../../../cursorless-engine/src/languages/elseIfExtractor";

export class JetbrainsIDE implements IDE {
  readonly configuration: JetbrainsConfiguration;
  readonly keyValueStore: JetbrainsKeyValueStore;
  readonly messages: JetbrainsMessages;
  readonly clipboard: JetbrainsClipboard;
  readonly capabilities: JetbrainsCapabilities;
  readonly runMode: RunMode = "development";
  //   private editorMap;
  //   private documentMap;
  private activeProject: Window | undefined;
  private activeEditor: JetbrainsEditor | undefined;

  private disposables: Disposable[] = [];
  private assetsRoot_: string | undefined;
  private cursorlessJetbrainsPath: string | undefined;
  private quickPickReturnValue: string | undefined = undefined;

  private editors: Map<string, JetbrainsEditor> = new Map<
    string,
    JetbrainsEditor
  >();

  private onDidChangeTextDocumentNotifier: Notifier<[TextDocumentChangeEvent]> =
    new Notifier();

  private onDidChangeTextDocumentContentNotifier: Notifier<
    [TextDocumentContentChangeEvent]
  > = new Notifier();

  constructor(private client: JetbrainsClient) {
    this.configuration = new JetbrainsConfiguration();
    this.keyValueStore = new JetbrainsKeyValueStore();
    this.messages = new JetbrainsMessages();
    this.clipboard = new JetbrainsClipboard(this.client);
    this.capabilities = new JetbrainsCapabilities();
    //     this.editorMap = new Map<Window, JetbrainsTextEditorImpl>();
    //     this.documentMap = new Map<Buffer, JetbrainsTextDocumentImpl>();
    this.activeProject = undefined;
    this.activeEditor = undefined;
  }

  async init() {}

  async showQuickPick(
    _items: readonly string[],
    _options?: QuickPickOptions,
  ): Promise<string | undefined> {
    throw Error("showQuickPick Not implemented");
  }

  async setHighlightRanges(
    _highlightId: string | undefined,
    _editor: TextEditor,
    _ranges: GeneralizedRange[],
  ): Promise<void> {
    throw Error("setHighlightRanges Not implemented");
  }

  async flashRanges(_flashDescriptors: FlashDescriptor[]): Promise<void> {
    console.debug("flashRanges Not implemented");
  }

  get assetsRoot(): string {
    console.log("get assetsRoot");
    throw new Error("assetsRoot not implemented.");
  }

  get cursorlessVersion(): string {
    console.log("get cursorlessVersion");
    throw new Error("cursorlessVersion not implemented.");
  }

  get workspaceFolders(): readonly WorkspaceFolder[] | undefined {
    console.log("get workspaceFolders");
    throw new Error("workspaceFolders not implemented.");
  }

  get activeTextEditor(): TextEditor | undefined {
    console.log("get activeTextEditor");
    return this.activeEditableTextEditor;
  }

  get activeEditableTextEditor(): EditableTextEditor | undefined {
    console.log("get activeEditableTextEditor");
    return this.activeEditor;
  }

  get visibleTextEditors(): TextEditor[] {
    console.log("get visibleTextEditors");
    //return [...this.editors.values()].filter((editor) => editor.isActive);
    if (this.activeEditor) {
      console.log("visible: " + this.activeEditor.id);
      return [this.activeEditor];
    } else {
      return [];
    }
  }

  getEditableTextEditor(editor: TextEditor): EditableTextEditor {
    console.log("getEditableTextEditor");
    if (editor instanceof JetbrainsEditor) {
      console.log("getEditableTextEditor - return current");
      return editor;
    }
    throw Error(`Unsupported text editor type: ${editor}`);
  }

  public async findInDocument(
    _query: string,
    _editor: TextEditor,
  ): Promise<void> {
    throw Error("findInDocument Not implemented");
  }

  public async findInWorkspace(_query: string): Promise<void> {
    throw Error("findInWorkspace Not implemented");
  }

  public async openTextDocument(_path: string): Promise<TextEditor> {
    throw Error("openTextDocument Not implemented");
  }

  public async openUntitledTextDocument(
    _options: OpenUntitledTextDocumentOptions,
  ): Promise<TextEditor> {
    throw Error("openUntitledTextDocument Not implemented");
  }

  public async showInputBox(_options?: any): Promise<string | undefined> {
    throw Error("TextDocumentChangeEvent Not implemented");
  }

  public async executeCommand<T>(
    _command: string,
    ..._args: any[]
  ): Promise<T | undefined> {
    throw new Error("executeCommand Method not implemented.");
  }

  public onDidChangeTextDocument(
    listener: (event: TextDocumentChangeEvent) => void,
  ): Disposable {
    return this.onDidChangeTextDocumentNotifier.registerListener(listener);
  }

  public onDidOpenTextDocument(
    listener: (event: TextDocument) => any,
    thisArgs?: any,
    disposables?: Disposable[] | undefined,
  ): Disposable {
    return jetbrainsOnDidOpenTextDocument(listener, thisArgs, disposables);
  }
  onDidCloseTextDocument: Event<TextDocument> = dummyEvent;
  onDidChangeActiveTextEditor: Event<TextEditor | undefined> = dummyEvent;
  onDidChangeVisibleTextEditors: Event<TextEditor[]> = dummyEvent;
  onDidChangeTextEditorSelection: Event<TextEditorSelectionChangeEvent> =
    dummyEvent;
  onDidChangeTextEditorVisibleRanges: Event<TextEditorVisibleRangesChangeEvent> =
    dummyEvent;

  handleCommandError(_err: Error) {
    // if (err instanceof OutdatedExtensionError) {
    //   this.showUpdateExtensionErrorMessage(err);
    // } else {
    //     void showErrorMessage(this.client, err.message);
    // }
  }

  disposeOnExit(...disposables: Disposable[]): () => void {
    this.disposables.push(...disposables);

    return () => pull(this.disposables, ...disposables);
  }

  public documentChanged(editorStateJson: any) {
    console.log(
      "ASOEE/CL: documentChanged : " + JSON.stringify(editorStateJson),
    );
    const editorState = editorStateJson as EditorState;

    const editor = this.updateTextEditors(editorState);

    const linedata = getLines(
      editorState.text,
      editorState.firstVisibleLine,
      editorState.lastVisibleLine,
    );
    const contentChangeEvents = fromJetbrainsContentChange(
      editor.document,
      editorState.firstVisibleLine,
      editorState.lastVisibleLine,
      linedata,
    );
    const documentChangeEvent: TextDocumentChangeEvent = {
      document: editor.document,
      contentChanges: contentChangeEvents,
    };
    console.log("ASOEE/CL: documentChanged : notify...");
    this.emitDidChangeTextDocument(documentChangeEvent);
    console.log("ASOEE/CL: documentChanged : notify complete");
  }

  emitDidChangeTextDocument(event: TextDocumentChangeEvent) {
    this.onDidChangeTextDocumentNotifier.notifyListeners(event);
  }

  updateTextEditors(editorState: EditorState): JetbrainsEditor {
    let editor = this.editors.get(editorState.id);
    if (editor) {
      updateEditor(editor, editorState);
    } else {
      editor = createTextEditor(this.client, this, editorState);
      this.editors.set(editorState.id, editor);
    }
    if (editorState.active) {
      this.activeEditor = editor;
    }
    return editor;
  }
}

function updateEditor(editor: JetbrainsEditor, editorState: EditorState) {
  console.log("Updating editor " + editorState.id);
  const oldDocument = editor.document;
  editor.document = new InMemoryTextDocument(
    oldDocument.uri,
    oldDocument.languageId,
    editorState.text,
  );
  editor.visibleRanges = [
    new Range(editorState.firstVisibleLine, 0, editorState.lastVisibleLine, 0),
  ];
  editor.selections = editorState.selections.map((selection) =>
    createSelection(editor.document, selection),
  );
}

function getLines(text: string, firstLine: number, lastLine: number) {
  const lines = text.split("\n");
  return lines.slice(firstLine, lastLine);
}

function dummyEvent() {
  return {
    dispose() {
      // empty
    },
  };
}

export function createIDE(client: JetbrainsClient) {
  return new JetbrainsIDE(client);
}