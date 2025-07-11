import type {
  ScopeType,
  SimpleScopeType,
  TextEditor,
} from "@cursorless/common";
import type { TreeSitterQuery } from "../../../../languages/TreeSitterQuery";
import type { QueryMatch } from "../../../../languages/TreeSitterQuery/QueryCapture";
import { PlainTarget } from "../../../targets";
import type { ExtendedTargetScope } from "./BaseTreeSitterScopeHandler";
import { BaseTreeSitterScopeHandler } from "./BaseTreeSitterScopeHandler";
import { getRelatedCapture, getRelatedRange } from "./captureUtils";

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
    query: TreeSitterQuery,
    /** The scope type for which we are the iteration scope */
    private iterateeScopeType: SimpleScopeType,
  ) {
    super(query);
  }

  protected matchToScope(
    editor: TextEditor,
    match: QueryMatch,
    _isEveryScope: boolean,
  ): ExtendedTargetScope | undefined {
    const scopeTypeType = this.iterateeScopeType.type;

    const capture = getRelatedCapture(match, scopeTypeType, "iteration", false);

    if (capture == null) {
      // This capture was for some unrelated scope type
      return undefined;
    }

    const { range: contentRange, allowMultiple } = capture;

    // Don't yield empty iteration scopes
    if (contentRange.isEmpty) {
      return undefined;
    }

    const domain =
      getRelatedRange(match, scopeTypeType, "iteration.domain", false) ??
      contentRange;

    return {
      editor,
      domain,
      allowMultiple,
      getTargets: (isReversed) => [
        new PlainTarget({
          editor,
          isReversed,
          contentRange,
        }),
      ],
    };
  }
}
