import { ScopeType, SimpleScopeType, TextEditor } from "@cursorless/common";
import { Query, QueryMatch } from "web-tree-sitter";
import { TreeSitter } from "../../../..";
import { PlainTarget } from "../../../targets";
import { TargetScope } from "../scope.types";
import { BaseTreeSitterScopeHandler } from "./BaseTreeSitterScopeHandler";
import { getRelatedRange, getCaptureRangeByName } from "./captureUtils";

/** Scope handler to be used for iteration scopes of tree-sitter scope types */
export class TreeSitterIterationScopeHandler extends BaseTreeSitterScopeHandler {
  protected isHierarchical = true;

  // Doesn't correspond to any scope type
  public scopeType = undefined;

  // Doesn't have any iteration scope type itself; that would correspond to
  // something like "every every"
  public get iterationScopeType(): ScopeType {
    throw Error("Not implemented");
  }

  constructor(
    treeSitter: TreeSitter,
    query: Query,
    /** The scope type for which we are the iteration scope */
    private iterateeScopeType: SimpleScopeType,
  ) {
    super(treeSitter, query);
  }

  protected matchToScope(
    editor: TextEditor,
    match: QueryMatch,
  ): TargetScope | undefined {
    const scopeTypeType = this.iterateeScopeType.type;

    const contentRange = getRelatedRange(match, scopeTypeType, "iteration")!;

    if (contentRange == null) {
      // This capture was for some unrelated scope type
      return undefined;
    }

    const domain =
      getCaptureRangeByName(
        match,
        `${scopeTypeType}.iteration.domain`,
        `_.iteration.domain`,
      ) ?? contentRange;

    return {
      editor,
      domain,
      getTarget: (isReversed) =>
        new PlainTarget({
          editor,
          isReversed,
          contentRange,
        }),
    };
  }
}
