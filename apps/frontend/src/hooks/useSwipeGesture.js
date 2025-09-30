import { useState, useEffect, useRef } from "react";

export function useSwipeGesture(itemCount) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [containerW, setContainerW] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 360
  );
  const [touchStartX, setTouchStartX] = useState(null);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef(null);

  // Reset to first slide when item count changes
  useEffect(() => {
    setActiveSlide(0);
    setDragX(0);
  }, [itemCount]);

  // Measure container width
  useEffect(() => {
    const update = () => {
      if (sliderRef?.current) {
        const w =
          sliderRef.current.offsetWidth ||
          sliderRef.current.clientWidth ||
          window.innerWidth;
        if (w && w !== containerW) setContainerW(w);
      } else if (typeof window !== "undefined") {
        setContainerW(window.innerWidth);
      }
    };
    update();
    const ro =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null;
    if (ro && sliderRef?.current) ro.observe(sliderRef.current);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
      if (ro && sliderRef?.current) ro.unobserve(sliderRef.current);
    };
  }, [containerW]);

  const onTouchStart = (e) => {
    setIsDragging(true);
    setTouchStartX(e.touches[0].clientX);
  };

  const onTouchMove = (e) => {
    if (!isDragging || touchStartX == null) return;
    setDragX(e.touches[0].clientX - touchStartX);
  };

  const onTouchEnd = () => {
    if (!isDragging) return;
    const threshold = Math.min(80, containerW * 0.15);
    if (dragX < -threshold && activeSlide < itemCount - 1) {
      setActiveSlide((i) => i + 1);
    } else if (dragX > threshold && activeSlide > 0) {
      setActiveSlide((i) => i - 1);
    }
    setDragX(0);
    setIsDragging(false);
  };

  return {
    activeSlide,
    containerW,
    dragX,
    isDragging,
    sliderRef,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
}

