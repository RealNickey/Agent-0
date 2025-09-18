"use client";

import { useToolCallUI } from "@/contexts/ToolCallUIContext";
import { AnimatePresence, motion } from "framer-motion";

const ToolCallCanvas = () => {
  const { toolCallUIs } = useToolCallUI();

  return (
    <AnimatePresence>
      {toolCallUIs.map(({ id, component }) => (
        <motion.div
          key={id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="w-full"
        >
          {component}
        </motion.div>
      ))}
    </AnimatePresence>
  );
};

export default ToolCallCanvas;
