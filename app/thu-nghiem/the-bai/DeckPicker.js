import { useRef } from "react";
import { Card } from "./Card";

export default function DeckPicker({ cards, myDeck, shuffling, onToggle }) {
  const drag = useRef(null);

  function beginDrag(event) {
    if (event.pointerType !== "mouse" || event.button !== 0 || !event.target.closest(".ttpick")) return;
    const rail = event.currentTarget;
    if (rail.scrollWidth > rail.clientWidth) {
      drag.current = { x: event.clientX, left: rail.scrollLeft };
    }
  }

  function moveDrag(event) {
    if (!drag.current || event.pointerType !== "mouse" || event.buttons !== 1) return;
    const rail = event.currentTarget;
    const distance = event.clientX - drag.current.x;
    if (!rail.hasPointerCapture(event.pointerId)) {
      if (Math.abs(distance) < 6) return;
      // Deliver the release to the rail so dragging across a card cannot select it.
      rail.setPointerCapture(event.pointerId);
    }
    rail.scrollLeft = drag.current.left - distance;
  }

  function endDrag() {
    drag.current = null;
  }

  if (!cards.length) return <p className="hint">Không có thẻ phù hợp với bộ lọc này.</p>;
  return (
    <div className={`ttpool ttdeckrail ${shuffling ? "shuffling" : ""}`}
      role="region" aria-label="Chọn thẻ cho bộ bài" tabIndex={0}
      onPointerDown={beginDrag} onPointerMove={moveDrag} onPointerUp={endDrag}
      onPointerLeave={endDrag} onPointerCancel={endDrag} onLostPointerCapture={endDrag}>
      {cards.map((card, n) => {
        const slot = myDeck.indexOf(card.id);
        const selected = slot >= 0;
        return (
          <div key={card.id} className={`ttpick ${selected ? "in" : ""}`}
            style={{ "--sx": ((n * 53) % 100) - 50, "--sy": ((n * 31) % 60) - 30, "--sr": ((n * 47) % 50) - 25, "--n": n }}>
            <Card c={card} owner={selected ? "me" : null} badge={selected ? slot + 1 : null}
              named onClick={() => onToggle(card, slot)} />
          </div>
        );
      })}
    </div>
  );
}
