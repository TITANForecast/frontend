"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider-multitenancy";
import {
  X,
  Check,
  XCircle,
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

interface AIEvaluation {
  id: string;
  evaluation_id?: number; // Backend may return evaluation_id
  operation_id?: string;
  eligible: boolean;
  confidence: number;
  reason: string;
  rule_applied: string;
  created_at?: string;
  evaluated_at?: string; // Backend may return evaluated_at
  user_confirmed?: boolean | null; // true = confirmed, false = denied, null = pending
}

interface OperationInfo {
  id: string;
  operation_code?: string;
  operation_description?: string;
  ro_number?: string | null;
}

interface AIEvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  operationId?: string;
  operationIds?: string[]; // For bulk mode
  operations?: OperationInfo[]; // Operation details for bulk mode
  dealerId: string;
  onEvaluationComplete?: () => void;
}

export default function AIEvaluationModal({
  isOpen,
  onClose,
  operationId,
  operationIds,
  operations,
  dealerId,
  onEvaluationComplete,
}: AIEvaluationModalProps) {
  const { getAuthToken } = useAuth();
  const isBulkMode = !!operationIds && operationIds.length > 0;
  const effectiveOperationIds = isBulkMode
    ? operationIds!
    : operationId
    ? [operationId]
    : [];

  const [evaluation, setEvaluation] = useState<AIEvaluation | null>(null);
  const [evaluations, setEvaluations] = useState<Map<string, AIEvaluation>>(
    new Map()
  );
  const [evaluationErrors, setEvaluationErrors] = useState<Map<string, string>>(
    new Map()
  );
  const [loading, setLoading] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [confirming, setConfirming] = useState<boolean | null>(null); // true = confirming, false = denying, null = not processing
  const [confirmingOperationId, setConfirmingOperationId] = useState<
    string | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [expandedOperations, setExpandedOperations] = useState<Set<string>>(
    new Set()
  );
  const [summaryStats, setSummaryStats] = useState<{
    total: number;
    successful: number;
    failed: number;
  } | null>(null);

  // Normalize backend response to frontend format
  const normalizeEvaluation = (data: any): AIEvaluation => {
    return {
      id: String(data.evaluation_id || data.id || ""),
      evaluation_id: data.evaluation_id,
      operation_id: String(data.operation_id || operationId || ""),
      eligible: data.eligible ?? false,
      confidence: data.confidence ?? 0,
      reason: data.reason || "",
      rule_applied: data.rule_applied || "",
      created_at: data.evaluated_at || data.created_at || "",
      evaluated_at: data.evaluated_at,
      user_confirmed:
        data.user_confirmed !== undefined ? data.user_confirmed : null,
    };
  };

  // Load existing evaluations when modal opens
  useEffect(() => {
    if (isOpen && effectiveOperationIds.length > 0) {
      if (isBulkMode) {
        loadExistingEvaluations();
      } else {
        loadExistingEvaluation();
      }
    } else {
      setEvaluation(null);
      setEvaluations(new Map());
      setEvaluationErrors(new Map());
      setError(null);
      setInfoMessage(null);
      setConfirming(null);
      setConfirmingOperationId(null);
      setExpandedOperations(new Set());
      setSummaryStats(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, operationId, operationIds?.join(",")]);

  const loadExistingEvaluation = async () => {
    setLoadingExisting(true);
    setInfoMessage(null);
    setError(null);
    try {
      const token = await getAuthToken();
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(
        `/api/dealer-settings/operations/${operationId}/ai-evaluation?dealerId=${dealerId}`,
        {
          method: "GET",
          headers,
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Check if it's a "not found" informational response
        if (data.notFound) {
          setInfoMessage(
            data.message ||
              "No AI evaluation found for this operation. Click the button below to run a new evaluation."
          );
          setEvaluation(null);
        } else if (data) {
          setEvaluation(normalizeEvaluation(data));
          setInfoMessage(null);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || "Failed to load evaluation");
      }
    } catch (err: any) {
      // Silently fail - user can still run a new evaluation
      console.error("Failed to load existing evaluation:", err);
    } finally {
      setLoadingExisting(false);
    }
  };

  const loadExistingEvaluations = async () => {
    setLoadingExisting(true);
    setInfoMessage(null);
    setError(null);
    const newEvaluations = new Map<string, AIEvaluation>();
    const newErrors = new Map<string, string>();

    try {
      const token = await getAuthToken();
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      // Load existing evaluations for all operations
      await Promise.all(
        effectiveOperationIds.map(async (opId) => {
          try {
            const response = await fetch(
              `/api/dealer-settings/operations/${opId}/ai-evaluation?dealerId=${dealerId}`,
              {
                method: "GET",
                headers,
              }
            );

            if (response.ok) {
              const data = await response.json();
              if (data && !data.notFound) {
                newEvaluations.set(opId, normalizeEvaluation(data));
              }
            }
          } catch (err) {
            // Silently fail for individual operations
            console.error(
              `Failed to load evaluation for operation ${opId}:`,
              err
            );
          }
        })
      );

      setEvaluations(newEvaluations);
      setEvaluationErrors(newErrors);
    } catch (err: any) {
      console.error("Failed to load existing evaluations:", err);
    } finally {
      setLoadingExisting(false);
    }
  };

  const handleRunEvaluation = async () => {
    setLoading(true);
    setError(null);
    setInfoMessage(null);
    setEvaluation(null);
    setEvaluations(new Map());
    setEvaluationErrors(new Map());

    try {
      const token = await getAuthToken();
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      // Use batch endpoint
      const response = await fetch(
        `/api/dealer-settings/operations/batch-evaluate-ai/?dealerId=${dealerId}`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            operation_ids: effectiveOperationIds,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to evaluate operations");
      }

      const batchData = await response.json();

      // Store summary stats for display
      const stats = {
        total: batchData.total || effectiveOperationIds.length,
        successful: batchData.successful || 0,
        failed: batchData.failed || 0,
      };
      setSummaryStats(stats);

      if (batchData.results && Array.isArray(batchData.results)) {
        if (isBulkMode) {
          // Handle bulk mode - store all evaluations
          const newEvaluations = new Map<string, AIEvaluation>();
          const newErrors = new Map<string, string>();

          batchData.results.forEach((result: any) => {
            // Convert operation_id to string for consistent key matching
            const opIdStr = String(result.operation_id);

            if (result.success) {
              // The evaluation data is directly in the result object, not nested
              const evalData = {
                evaluation_id: result.evaluation_id,
                operation_id: result.operation_id,
                eligible: result.eligible,
                confidence: result.confidence,
                reason: result.reason || "",
                rule_applied: result.rule_applied || "",
                evaluated_at: result.evaluated_at,
              };
              newEvaluations.set(opIdStr, normalizeEvaluation(evalData));
            } else {
              newErrors.set(
                opIdStr,
                result.error || "Failed to evaluate operation"
              );
            }
          });

          setEvaluations(newEvaluations);
          setEvaluationErrors(newErrors);

          // Expand all operations by default
          setExpandedOperations(new Set(effectiveOperationIds));
        } else {
          // Handle single operation mode
          const opIdStr = effectiveOperationIds[0];
          const operationResult = batchData.results.find(
            (r: any) => String(r.operation_id) === opIdStr
          );

          if (operationResult) {
            if (operationResult.success) {
              // The evaluation data is directly in the result object
              const evalData = {
                evaluation_id: operationResult.evaluation_id,
                operation_id: operationResult.operation_id,
                eligible: operationResult.eligible,
                confidence: operationResult.confidence,
                reason: operationResult.reason || "",
                rule_applied: operationResult.rule_applied || "",
                evaluated_at: operationResult.evaluated_at,
              };
              setEvaluation(normalizeEvaluation(evalData));
            } else {
              throw new Error(
                operationResult.error || "Failed to evaluate operation"
              );
            }
          } else {
            throw new Error("Operation result not found in batch response");
          }
        }
      } else {
        throw new Error("Invalid batch response format");
      }
    } catch (err: any) {
      setError(err.message || "Failed to evaluate operations");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (
    confirmed: boolean,
    evalId?: string,
    opId?: string
  ) => {
    const evalToConfirm = evalId ? evaluations.get(opId || "") : evaluation;
    if (!evalToConfirm) return;

    setConfirming(confirmed);
    setConfirmingOperationId(opId || null);
    setError(null);

    try {
      const token = await getAuthToken();
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(
        `/api/warranty/ai-evaluations/${evalToConfirm.id}/confirm/`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            confirmed,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to confirm evaluation");
      }

      // In bulk mode, reload only the specific operation's evaluation to get updated confirmation status
      if (isBulkMode && opId) {
        try {
          const token = await getAuthToken();
          const headers: HeadersInit = {
            "Content-Type": "application/json",
          };
          if (token) {
            headers["Authorization"] = `Bearer ${token}`;
          }

          // Reload just this operation's evaluation
          const evalResponse = await fetch(
            `/api/dealer-settings/operations/${opId}/ai-evaluation?dealerId=${dealerId}`,
            {
              method: "GET",
              headers,
            }
          );

          if (evalResponse.ok) {
            const evalData = await evalResponse.json();
            if (evalData && !evalData.notFound) {
              // Update only this operation's evaluation in the map
              const updatedEvaluations = new Map(evaluations);
              updatedEvaluations.set(opId, normalizeEvaluation(evalData));
              setEvaluations(updatedEvaluations);
            }
          }
        } catch (err) {
          console.error(
            `Failed to reload evaluation for operation ${opId}:`,
            err
          );
          // Don't throw - just log the error, confirmation was successful
        }

        // Refresh the background table without closing the modal
        if (onEvaluationComplete) {
          await onEvaluationComplete();
        }

        setConfirming(null);
        setConfirmingOperationId(null);
      } else {
        // Single operation mode - refresh and close
        if (onEvaluationComplete) {
          await onEvaluationComplete();
        }
        onClose();
      }
    } catch (err: any) {
      setError(err.message || "Failed to confirm evaluation");
      setConfirming(null);
      setConfirmingOperationId(null);
    }
  };

  const toggleExpandOperation = (opId: string) => {
    const newExpanded = new Set(expandedOperations);
    if (newExpanded.has(opId)) {
      newExpanded.delete(opId);
    } else {
      newExpanded.add(opId);
    }
    setExpandedOperations(newExpanded);
  };

  const handleClose = () => {
    if (!loading && confirming === null) {
      setEvaluation(null);
      setError(null);
      setInfoMessage(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if clicking the backdrop itself, not the modal content
    if (e.target === e.currentTarget && confirming === null && !loading) {
      handleClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-gray-900/50 dark:bg-gray-900/80 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {isBulkMode
              ? `Bulk Warranty AI Evaluation (${effectiveOperationIds.length} operations)`
              : "Warranty AI Evaluation"}
          </h2>
          <button
            onClick={handleClose}
            disabled={loading || confirming !== null}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {infoMessage && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 px-4 py-3 rounded">
              {infoMessage}
            </div>
          )}

          {loadingExisting && (
            <div className="text-center py-8">
              <Loader2
                size={32}
                className="animate-spin mx-auto text-violet-500 mb-4"
              />
              <p className="text-gray-600 dark:text-gray-400">
                Loading existing evaluation...
              </p>
            </div>
          )}

          {!evaluation &&
            evaluations.size === 0 &&
            !loading &&
            !loadingExisting && (
              <div className="text-center py-8">
                {!infoMessage && (
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {isBulkMode
                      ? `Click the button below to run AI evaluations for ${effectiveOperationIds.length} selected operations. The AI will analyze each operation and determine warranty eligibility.`
                      : "Click the button below to run an AI evaluation for this operation. The AI will analyze the operation details and determine warranty eligibility."}
                  </p>
                )}
                <button
                  onClick={handleRunEvaluation}
                  disabled={loading}
                  className="btn bg-violet-500 hover:bg-violet-600 text-white flex items-center gap-2 mx-auto"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Evaluating...
                    </>
                  ) : isBulkMode ? (
                    `Run Warranty AI Evaluation (${effectiveOperationIds.length} operations)`
                  ) : (
                    "Run Warranty AI Evaluation"
                  )}
                </button>
              </div>
            )}

          {loading && (
            <div className="text-center py-8">
              <Loader2
                size={32}
                className="animate-spin mx-auto text-violet-500 mb-4"
              />
              <p className="text-gray-600 dark:text-gray-400">
                {isBulkMode
                  ? `Running AI evaluations for ${effectiveOperationIds.length} operations...`
                  : "Running AI evaluation..."}
              </p>
            </div>
          )}

          {evaluation && (
            <div className="space-y-6">
              {/* Eligibility Result */}
              <div className="bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  {evaluation.eligible ? (
                    <Check
                      size={24}
                      className="text-green-600 dark:text-green-400"
                    />
                  ) : (
                    <XCircle
                      size={24}
                      className="text-red-600 dark:text-red-400"
                    />
                  )}
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {evaluation.eligible ? "Eligible" : "Not Eligible"}
                  </h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  The AI has determined this operation is{" "}
                  {evaluation.eligible
                    ? "warranty eligible"
                    : "not warranty eligible"}
                  .
                </p>
                {/* User Confirmation Status */}
                {evaluation.user_confirmed !== null &&
                  evaluation.user_confirmed !== undefined && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          User Confirmation:
                        </span>
                        {evaluation.user_confirmed ? (
                          <span className="inline-flex items-center px-2 py-1 rounded text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400">
                            <Check size={14} className="mr-1" />
                            Confirmed
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded text-sm font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400">
                            <XCircle size={14} className="mr-1" />
                            Denied
                          </span>
                        )}
                      </div>
                    </div>
                  )}
              </div>

              {/* Confidence Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confidence Level
                </label>
                <div className="flex items-center gap-4">
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        evaluation.confidence >= 0.7
                          ? "bg-green-500"
                          : evaluation.confidence >= 0.5
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${evaluation.confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[60px]">
                    {(evaluation.confidence * 100).toFixed(1)}%
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {evaluation.confidence >= 0.7
                    ? "High confidence"
                    : evaluation.confidence >= 0.5
                    ? "Medium confidence"
                    : "Low confidence"}
                </p>
              </div>

              {/* Explanation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Explanation
                </label>
                <div className="bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {evaluation.reason}
                  </p>
                </div>
              </div>

              {/* Rule Applied */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Referenced Rule(s)
                </label>
                <div className="bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {evaluation.rule_applied || "No specific rule referenced"}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={handleRunEvaluation}
                  disabled={loading || confirming !== null}
                  className="btn border-violet-200 dark:border-violet-800 hover:border-violet-300 dark:hover:border-violet-700 text-violet-600 dark:text-violet-400 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Rerunning...
                    </>
                  ) : (
                    <>
                      <RefreshCw size={16} />
                      Rerun Evaluation
                    </>
                  )}
                </button>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="btn border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-300"
                    disabled={confirming !== null}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => handleConfirm(false)}
                    disabled={confirming !== null}
                    className="btn border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-700 text-red-600 dark:text-red-400 flex items-center gap-2"
                  >
                    {confirming === false ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <XCircle size={16} />
                        Deny
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleConfirm(true)}
                    disabled={confirming !== null}
                    className="btn bg-violet-500 hover:bg-violet-600 text-white flex items-center gap-2"
                  >
                    {confirming === true ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Check size={16} />
                        Confirm
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Bulk Mode: Show all evaluations */}
          {isBulkMode && evaluations.size > 0 && (
            <div className="space-y-4">
              {/* Summary Statistics */}
              <div className="bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Evaluation Summary
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Total
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {summaryStats?.total || effectiveOperationIds.length}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Successful
                    </div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {summaryStats?.successful || evaluations.size}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Failed
                    </div>
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {summaryStats?.failed || evaluationErrors.size}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Eligible
                    </div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {
                        Array.from(evaluations.values()).filter(
                          (e) => e.eligible
                        ).length
                      }
                    </div>
                  </div>
                </div>
              </div>

              {/* Operations List */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Operation Evaluations
                </h3>
                <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                  {effectiveOperationIds.map((opId) => {
                    const evalResult = evaluations.get(opId);
                    const errorMsg = evaluationErrors.get(opId);
                    const isExpanded = expandedOperations.has(opId);
                    const operationInfo = operations?.find(
                      (op) => op.id === opId
                    );

                    return (
                      <div
                        key={opId}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                      >
                        {/* Operation Header */}
                        <div
                          className="bg-gray-50 dark:bg-gray-900/30 p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-900/50 transition-colors"
                          onClick={() => toggleExpandOperation(opId)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                                {isExpanded ? (
                                  <ChevronDown size={18} />
                                ) : (
                                  <ChevronRight size={18} />
                                )}
                              </button>
                              <div className="flex-1">
                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {operationInfo?.operation_code ||
                                    `Operation ID: ${opId}`}
                                </div>
                                {operationInfo?.operation_description && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {operationInfo.operation_description}
                                  </div>
                                )}
                                {operationInfo?.ro_number && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    RO: {operationInfo.ro_number}
                                  </div>
                                )}
                                {evalResult && (
                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    {evalResult.eligible ? (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                                        <Check size={12} className="mr-1" />
                                        Eligible
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400">
                                        <XCircle size={12} className="mr-1" />
                                        Not Eligible
                                      </span>
                                    )}
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      Confidence:{" "}
                                      {(evalResult.confidence * 100).toFixed(1)}
                                      %
                                    </span>
                                    {evalResult.user_confirmed !== null &&
                                      evalResult.user_confirmed !==
                                        undefined && (
                                        <span
                                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                            evalResult.user_confirmed
                                              ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400"
                                              : "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400"
                                          }`}
                                        >
                                          {evalResult.user_confirmed ? (
                                            <>
                                              <Check
                                                size={12}
                                                className="mr-1"
                                              />
                                              Confirmed
                                            </>
                                          ) : (
                                            <>
                                              <XCircle
                                                size={12}
                                                className="mr-1"
                                              />
                                              Denied
                                            </>
                                          )}
                                        </span>
                                      )}
                                  </div>
                                )}
                                {errorMsg && (
                                  <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                                    Error: {errorMsg}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Expanded Details */}
                        {isExpanded && evalResult && (
                          <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 space-y-4">
                            {/* Eligibility Result */}
                            <div className="bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                              <div className="flex items-center gap-3 mb-2">
                                {evalResult.eligible ? (
                                  <Check
                                    size={20}
                                    className="text-green-600 dark:text-green-400"
                                  />
                                ) : (
                                  <XCircle
                                    size={20}
                                    className="text-red-600 dark:text-red-400"
                                  />
                                )}
                                <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                                  {evalResult.eligible
                                    ? "Eligible"
                                    : "Not Eligible"}
                                </h4>
                              </div>
                              {/* User Confirmation Status */}
                              {evalResult.user_confirmed !== null &&
                                evalResult.user_confirmed !== undefined && (
                                  <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                        User Confirmation:
                                      </span>
                                      {evalResult.user_confirmed ? (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400">
                                          <Check size={12} className="mr-1" />
                                          Confirmed
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400">
                                          <XCircle size={12} className="mr-1" />
                                          Denied
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )}
                            </div>

                            {/* Confidence Level */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Confidence Level
                              </label>
                              <div className="flex items-center gap-4">
                                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      evalResult.confidence >= 0.7
                                        ? "bg-green-500"
                                        : evalResult.confidence >= 0.5
                                        ? "bg-yellow-500"
                                        : "bg-red-500"
                                    }`}
                                    style={{
                                      width: `${evalResult.confidence * 100}%`,
                                    }}
                                  />
                                </div>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[60px]">
                                  {(evalResult.confidence * 100).toFixed(1)}%
                                </span>
                              </div>
                            </div>

                            {/* Explanation */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Explanation
                              </label>
                              <div className="bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                  {evalResult.reason}
                                </p>
                              </div>
                            </div>

                            {/* Rule Applied */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Referenced Rule(s)
                              </label>
                              <div className="bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                  {evalResult.rule_applied ||
                                    "No specific rule referenced"}
                                </p>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                              <button
                                type="button"
                                onClick={() =>
                                  handleConfirm(false, evalResult.id, opId)
                                }
                                disabled={
                                  confirming !== null &&
                                  confirmingOperationId !== opId
                                }
                                className="btn border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-700 text-red-600 dark:text-red-400 flex items-center gap-2 text-sm"
                              >
                                {confirming === false &&
                                confirmingOperationId === opId ? (
                                  <>
                                    <Loader2
                                      size={14}
                                      className="animate-spin"
                                    />
                                    Processing...
                                  </>
                                ) : (
                                  <>
                                    <XCircle size={14} />
                                    Deny
                                  </>
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleConfirm(true, evalResult.id, opId)
                                }
                                disabled={
                                  confirming !== null &&
                                  confirmingOperationId !== opId
                                }
                                className="btn bg-violet-500 hover:bg-violet-600 text-white flex items-center gap-2 text-sm"
                              >
                                {confirming === true &&
                                confirmingOperationId === opId ? (
                                  <>
                                    <Loader2
                                      size={14}
                                      className="animate-spin"
                                    />
                                    Processing...
                                  </>
                                ) : (
                                  <>
                                    <Check size={14} />
                                    Confirm
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bulk Actions */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={handleRunEvaluation}
                  disabled={loading || confirming !== null}
                  className="btn border-violet-200 dark:border-violet-800 hover:border-violet-300 dark:hover:border-violet-700 text-violet-600 dark:text-violet-400 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Rerunning...
                    </>
                  ) : (
                    <>
                      <RefreshCw size={16} />
                      Rerun All Evaluations
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="btn border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-300"
                  disabled={confirming !== null}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
