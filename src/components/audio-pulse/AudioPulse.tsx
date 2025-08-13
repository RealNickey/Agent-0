/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React from "react";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import c from "classnames";

const lineCount = 5; // Increased for better visual effect

export type AudioPulseProps = {
  active: boolean;
  volume: number;
  hover?: boolean;
};

const lineVariants = {
  idle: {
    height: 4,
    opacity: 0.6,
  },
  active: {
    height: [4, 20, 4],
    opacity: [0.6, 1, 0.6],
  },
  volume: {
    height: 8,
    opacity: 0.8,
  },
};

const containerVariants = {
  idle: {
    scale: 1,
  },
  hover: {
    scale: 1.1,
    transition: {
      duration: 0.2,
    },
  },
};

export default function AudioPulse({ active, volume, hover }: AudioPulseProps) {
  const [volumeLevels, setVolumeLevels] = useState<number[]>(new Array(lineCount).fill(0));

  useEffect(() => {
    if (!active) return;

    const interval = setInterval(() => {
      setVolumeLevels(prev => prev.map((_, i) => {
        const baseVolume = volume * (i === 2 ? 1 : i === 1 || i === 3 ? 0.8 : 0.6);
        const randomVariation = Math.random() * 0.3;
        return Math.min(1, baseVolume + randomVariation);
      }));
    }, 100);

    return () => clearInterval(interval);
  }, [active, volume]);

  return (
    <motion.div 
      className={c("audioPulse modern-audio-pulse", { active, hover })}
      variants={containerVariants}
      animate={hover ? "hover" : "idle"}
    >
      <AnimatePresence>
        {Array(lineCount)
          .fill(null)
          .map((_, i) => (
            <motion.div
              key={i}
              className="pulse-line modern-pulse-line"
              variants={lineVariants}
              initial="idle"
              animate={
                active 
                  ? volume > 0.01 
                    ? "volume"
                    : "active"
                  : "idle"
              }
              transition={{
                duration: active ? 0.6 : 0.3,
                repeat: active && volume <= 0.01 ? Infinity : 0,
                delay: i * 0.1,
                ease: "easeInOut",
              }}
              style={{
                height: active && volume > 0.01 ? 4 + volumeLevels[i] * 40 : undefined,
                backgroundColor: active 
                  ? volume > 0.01 
                    ? `hsl(${210 + i * 10}, 60%, ${60 + volumeLevels[i] * 20}%)`
                    : "var(--primary-500)"
                  : "var(--neutral-600)",
              }}
            />
          ))}
      </AnimatePresence>
    </motion.div>
  );
}
