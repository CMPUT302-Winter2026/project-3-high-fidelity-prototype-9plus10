import { useEffect, useMemo, useState } from "react";
import type { TutorialStep } from "../data/baseTutorialSteps";

type Props = {
  isOpen: boolean;
  steps: TutorialStep[];
  onClose: () => void;
  onFinish: () => void;
};

export default function TutorialModal({
  isOpen,
  steps,
  onClose,
  onFinish
}: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [frameRect, setFrameRect] = useState<DOMRect | null>(null);
  const [activeButton, setActiveButton] = useState<"back" | "skip" | "next" | null>(null);

  const current = steps[currentStep];

  useEffect(() => {
    if (!isOpen) return;

    const updateTarget = () => {
      const frame = document.querySelector(".phone-frame");
      setFrameRect(frame ? frame.getBoundingClientRect() : null);

      if (!current?.targetId) {
        setTargetRect(null);
        return;
      }

      const el = document.getElementById(current.targetId);
      if (!el) {
        setTargetRect(null);
        return;
      }

      setTargetRect(el.getBoundingClientRect());
    };

    updateTarget();
    window.addEventListener("resize", updateTarget);
    window.addEventListener("scroll", updateTarget);

    return () => {
      window.removeEventListener("resize", updateTarget);
      window.removeEventListener("scroll", updateTarget);
    };
  }, [isOpen, current]);

  const modalStyle = useMemo(() => {
    if (!targetRect || !frameRect) {
      return {};
    }

    const framePadding = 16;
    const cardWidth = Math.min(320, Math.max(240, frameRect.width - framePadding * 2));
    const cardHeight = 196;
    const targetTop = targetRect.top - frameRect.top;
    const targetBottom = targetRect.bottom - frameRect.top;
    const targetLeft = targetRect.left - frameRect.left;
    const targetCenter = targetTop + targetRect.height / 2;
    const spaceBelow = frameRect.height - targetBottom - framePadding;
    const preferAbove = (spaceBelow < cardHeight && targetTop > cardHeight) || targetCenter > frameRect.height * 0.68;

    const top = preferAbove
      ? Math.max(framePadding, targetTop - cardHeight - 28)
      : Math.min(targetBottom + 16, frameRect.height - cardHeight - framePadding);
    const left = Math.max(framePadding, Math.min(targetLeft, frameRect.width - cardWidth - framePadding));

    return {
      position: "absolute" as const,
      top: `${top}px`,
      left: `${left}px`,
      width: `${cardWidth}px`,
      maxWidth: `calc(100% - ${framePadding * 2}px)`,
      zIndex: 1001
    };
  }, [frameRect, targetRect]);

  const highlightStyle = useMemo(() => {
    if (!targetRect || !frameRect) return null;

    return {
      position: "absolute" as const,
      top: `${targetRect.top - frameRect.top - 6}px`,
      left: `${targetRect.left - frameRect.left - 6}px`,
      width: `${targetRect.width + 12}px`,
      height: `${targetRect.height + 12}px`,
      border: "3px solid #8b5cf6",
      borderRadius: "12px",
      boxShadow: "0 0 0 9999px rgba(0,0,0,0.45)",
      pointerEvents: "none" as const,
      zIndex: 1000
    };
  }, [frameRect, targetRect]);

  if (!isOpen) return null;

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      setCurrentStep(0);
      onFinish();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const skipTutorial = () => {
    setCurrentStep(0);
    onClose();
  };

  const navButtonStyle = (button: "back" | "skip" | "next", variant: "neutral" | "primary", disabled = false) => {
    const isActive = activeButton === button;

    return {
      border: variant === "primary" ? "2px solid #7c3aed" : "2px solid rgba(124, 58, 237, 0.22)",
      background: variant === "primary" ? "#9333ea" : "#f4f2f8",
      color: variant === "primary" ? "#ffffff" : "#6b7280",
      boxShadow: isActive ? "0 0 0 3px rgba(147, 51, 234, 0.24)" : "none",
      opacity: disabled ? 0.5 : 1,
      transform: isActive ? "translateY(-1px)" : "none",
      transition: "box-shadow 0.16s ease, transform 0.16s ease, border-color 0.16s ease",
      cursor: disabled ? "not-allowed" : "pointer"
    } as const;
  };

  return (
    <>
      {highlightStyle ? <div style={highlightStyle} /> : <div className="absolute inset-0 bg-black/50 z-[999]" />}

      <div
        style={modalStyle}
        className={!targetRect ? "absolute inset-0 flex items-center justify-center z-[1001] p-4" : ""}
      >
        <div className="bg-white p-6 rounded-xl shadow-lg w-[90%] max-w-md">
          <h2 className="text-xl font-bold mb-2">{current.title}</h2>
          <p className="mb-4 text-gray-700">{current.description}</p>

          <div className="flex justify-between">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              onMouseEnter={() => setActiveButton("back")}
              onMouseLeave={() => setActiveButton((current) => (current === "back" ? null : current))}
              onFocus={() => setActiveButton("back")}
              onBlur={() => setActiveButton((current) => (current === "back" ? null : current))}
              style={navButtonStyle("back", "neutral", currentStep === 0)}
              className="px-3 py-1 rounded"
            >
              Back
            </button>

          <div className="flex gap-2">
              <button
                onClick={skipTutorial}
                onMouseEnter={() => setActiveButton("skip")}
                onMouseLeave={() => setActiveButton((current) => (current === "skip" ? null : current))}
                onFocus={() => setActiveButton("skip")}
                onBlur={() => setActiveButton((current) => (current === "skip" ? null : current))}
                style={navButtonStyle("skip", "neutral")}
                className="px-3 py-1 rounded"
              >
                Skip
              </button>

              <button
                onClick={nextStep}
                onMouseEnter={() => setActiveButton("next")}
                onMouseLeave={() => setActiveButton((current) => (current === "next" ? null : current))}
                onFocus={() => setActiveButton("next")}
                onBlur={() => setActiveButton((current) => (current === "next" ? null : current))}
                style={navButtonStyle("next", "primary")}
                className="px-3 py-1 rounded"
              >
                {currentStep === steps.length - 1 ? "Finish" : "Next"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
