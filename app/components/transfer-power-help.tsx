"use client";

import { useId } from "react";
import styles from "./pet-hatch.module.css";

/** Native popovers support touch, keyboard, Escape, and outside-click dismissal. */
export function TransferPowerHelp({ parent }: { parent: number }) {
    const id = useId();
    return <>
        <button type="button" className={styles.helpButton} popoverTarget={id} aria-label={`Parent ${parent} Transfer Power information`}>i</button>
        <div id={id} popover="auto" className={styles.transferPowerTooltip}>
            <button type="button" popoverTarget={id} popoverTargetAction="hide" aria-label="Close Transfer Power information">×</button>
            <h3>Transfer Power</h3>
            <p>Transfer Power measures how difficult it is to transfer a trait into a monster, based on its PvE/PvP stats and any special breeding modifiers.</p>
            <ul>
                <li>Higher Transfer Power = harder to receive traits, easier to transfer traits from.</li>
                <li>Lower Transfer Power = easier to receive traits, harder to transfer traits from.</li>
                <li>The ratio between two monsters’ Transfer Power values determines their trait-transfer probability.</li>
            </ul>
            <p><strong>Normal breeding (A gives the trait to B):</strong><code>A → B = min(25, 25 × exp(0.7) × TransferPower_A / TransferPower_B)%</code></p>
            <p><strong>Super breeding:</strong> Double the normal percentage, capped at 50%.</p>
            <p><code>P_base = √((PvE Damage / PvP Damage) × (PvE Health / PvP Health))</code><code>P_effective = P_base × applicable special multipliers</code><code>Transfer Power = P_effective ^ (0.7 / ln(1.45))</code></p>
            <p>This is a relative comparison score, not a percentage. These probabilities come from our reverse-engineered breeding model. Only unmodified level-1, E-rank stats and breeding modifiers count; rank, level, gear, mutations, and account bonuses do not change the score.</p>
        </div>
    </>;
}
