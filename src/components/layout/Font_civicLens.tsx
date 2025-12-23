"use client";

import { motion } from "framer-motion";
import RotatingText from "@/frontend/components/RotatingText"

export default function FontCivicLens() {
    return (


        <span className="inline-flex items-baseline gap-2">

            <span className=" text-blue-100">
                Civic
            </span>
            <span className="inline-flex items-baseline bg-blue">
                <RotatingText
                    texts={['Lens!', 'Sense!', 'Power!']}
                    mainClassName="px-1 sm:px-2 md:px-1 text-white overflow-hidden py-0.5 sm:py-1 md:py-1 justify-center rounded-lg"
                    staggerFrom={"last"}
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "-120%" }}
                    staggerDuration={0.025}
                    splitLevelClassName="overflow-hidden pb-0.5 sm:pb-1 md:pb-1"
                    transition={{ type: "spring", damping: 30, stiffness: 400 }}
                    rotationInterval={4000}
                />
            </span>
        </span>
    );
}

