"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-provider-multitenancy";
import { X, Check, XCircle, Loader2 } from "lucide-react";

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
}

interface AIEvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  operationId: string;
  dealerId: string;
  onEvaluationComplete?: () => void;
}

export default function AIEvaluationModal({
  isOpen,
  onClose,
  operationId,
  dealerId,
  onEvaluationComplete,
}: AIEvaluationModalProps) {
  const { getAuthToken } = useAuth();
  const [evaluation, setEvaluation] = useState<AIEvaluation | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [confirming, setConfirming] = useState<boolean | null>(null); // true = confirming, false = denying, null = not processing
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Normalize backend response to frontend format
  const normalizeEvaluation = (data: any): AIEvaluation => {
    return {
      id: String(data.evaluation_id || data.id || ""),
      evaluation_id: data.evaluation_id,
      operation_id: data.operation_id || operationId,
      eligible: data.eligible,
      confidence: data.confidence,
      reason: data.reason || "",
      rule_applied: data.rule_applied || "",
      created_at: data.evaluated_at || data.created_at || "",
      evaluated_at: data.evaluated_at,
    };
  };

  // Load existing evaluation when modal opens
  useEffect(() => {
    if (isOpen && operationId) {
      loadExistingEvaluation();
    } else {
      setEvaluation(null);
      setError(null);
      setInfoMessage(null);
      setConfirming(null);
    }
  }, [isOpen, operationId]);

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
          setInfoMessage(data.message || "No AI evaluation found for this operation. Click the button below to run a new evaluation.");
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

  const handleRunEvaluation = async () => {
    setLoading(true);
    setError(null);
    setInfoMessage(null);
    setEvaluation(null);

    try {
      const token = await getAuthToken();
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(
        `/api/dealer-settings/operations/${operationId}/evaluate-ai?dealerId=${dealerId}`,
        {
          method: "POST",
          headers,
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to evaluate operation");
      }

      const data = await response.json();
      setEvaluation(normalizeEvaluation(data));
    } catch (err: any) {
      setError(err.message || "Failed to evaluate operation");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (confirmed: boolean) => {
    if (!evaluation) return;

    setConfirming(confirmed);
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
        `/api/warranty/ai-evaluations/${evaluation.id}/confirm`,
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

      if (onEvaluationComplete) {
        await onEvaluationComplete();
      }

      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to confirm evaluation");
    } finally {
      setConfirming(null);
    }
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
            Warranty AI Evaluation
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

          {!evaluation && !loading && !loadingExisting && (
            <div className="text-center py-8">
              {!infoMessage && (
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Click the button below to run an AI evaluation for this
                  operation. The AI will analyze the operation details and
                  determine warranty eligibility.
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
                Running AI evaluation...
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
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
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
          )}
        </div>
      </div>
    </div>
  );
}
