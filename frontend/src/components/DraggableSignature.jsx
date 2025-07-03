import React from "react";
import {
  DndContext,
  useDraggable,
  useSensor,
  useSensors,
  PointerSensor,
} from "@dnd-kit/core";

const DraggableItem = ({
  id,
  signatureText,
  position,
  fontSize = 16,
  fontFamily = "Arial",
  color = "#1E40AF",
  isBold = false,
  isUnderline = false,
}) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id });

  const finalStyle = {
    transform: `translate(${position.x + (transform?.x || 0)}px, ${
      position.y + (transform?.y || 0)
    }px)`,
    position: "absolute",
    minWidth: "150px",
    textAlign: "center",
    fontSize: `${fontSize}px`,
    fontFamily,
    color,
    fontWeight: isBold ? "bold" : "normal",
    textDecoration: isUnderline ? "underline" : "none",
    zIndex: 10,
  };

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="cursor-grab p-2 rounded-md shadow-lg select-none bg-white border border-gray-300"
      style={finalStyle}
    >
      {signatureText || "Drag and Type Here"}
    </div>
  );
};

const DraggableSignature = ({
  signatureText,
  position,
  onDrag,
  fontSize,
  fontFamily,
  color,
  isBold,
  isUnderline,
}) => {
  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event) => {
    const { delta } = event;
    if (!delta) return;

    const newPos = {
      x: position.x + delta.x,
      y: position.y + delta.y,
    };

    onDrag(newPos);
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <DraggableItem
        id="signature"
        signatureText={signatureText}
        position={position}
        fontSize={fontSize}
        fontFamily={fontFamily}
        color={color}
        isBold={isBold}
        isUnderline={isUnderline}
      />
    </DndContext>
  );
};

export default DraggableSignature;
