import styles from "./pet-hatch.module.css";

const math = (body: string) => `<math xmlns="http://www.w3.org/1998/Math/MathML" display="block">${body}</math>`;
const powerEquation = math(`<mrow><msub><mi>P</mi><mi>m</mi></msub><mo>=</mo><msub><mi>M</mi><mi>m</mi></msub><mo>×</mo><msqrt><mrow><mfrac><msub><mi>D</mi><mtext>PvE</mtext></msub><msub><mi>D</mi><mtext>PvP</mtext></msub></mfrac><mo>×</mo><mfrac><msub><mi>H</mi><mtext>PvE</mtext></msub><msub><mi>H</mi><mtext>PvP</mtext></msub></mfrac></mrow></msqrt></mrow>`);
const ratioEquation = math(`<mrow><mi>R</mi><mo>=</mo><mfrac><msub><mi>P</mi><mtext>target</mtext></msub><msub><mi>P</mi><mtext>source</mtext></msub></mfrac></mrow>`);
const normalEquation = math(`<mrow><msub><mi>C</mi><mtext>Normal</mtext></msub><mo>=</mo><mi>min</mi><mo>(</mo><mn>25</mn><mo>,</mo><mn>25</mn><mo>×</mo><msup><mi>e</mi><mrow><mo>−</mo><mn>0.7</mn><mo>(</mo><msub><mi>log</mi><mn>1.45</mn></msub><mo>(</mo><mi>R</mi><mo>)</mo><mo>−</mo><mn>1</mn><mo>)</mo></mrow></msup><mo>)</mo></mrow>`);
const superEquation = math(`<mrow><msub><mi>C</mi><mtext>Super</mtext></msub><mo>=</mo><mi>min</mi><mo>(</mo><mn>50</mn><mo>,</mo><mn>2</mn><mo>×</mo><msub><mi>C</mi><mtext>Normal</mtext></msub><mo>)</mo></mrow>`);
const implementation = `from math import sqrt, log, exp

def power(pve_damage, pvp_damage, pve_hp, pvp_hp,
          evolution=False, dumplorer=False, gravitas=False):
    p = sqrt((pve_damage / pvp_damage) * (pve_hp / pvp_hp))
    if evolution:
        p *= 2.2 if gravitas else 2.1984
    if dumplorer or gravitas:
        p *= 1.25
    return p

def trait_chance(source_power, target_power):
    r = target_power / source_power
    normal = min(25, 25 * exp(-0.7 * (log(r, 1.45) - 1)))
    return normal, min(50, normal * 2)

# Compute power() separately for source and target.
# Pass both powers to trait_chance(); outputs are percentages.`;

export function TraitTransferHelp() {
    return <section id="trait-formula-help" className={styles.formulaHelp} aria-label="Trait transfer formula">
        <h3>How the estimate works</h3>
        <p>The source is the parent giving the trait. The target is the monster species receiving it. Calculate a normalized power score for each monster using its unmodified level-1, E-rank base stats.</p>
        <div className={styles.formula} dangerouslySetInnerHTML={{ __html: powerEquation }} />
        <dl>
            <dt>D</dt><dd>Base damage in PvE or PvP.</dd>
            <dt>H</dt><dd>Base health in PvE or PvP.</dd>
            <dt>M</dt><dd>Start at 1. Multiply by 2.1984 for an evolution (2.2 for Gravitas), then by another 1.25 for Dumplorer or Gravitas. Dumplorer’s total modifier is 2.748; Gravitas’s is 2.75.</dd>
            <dt>P</dt><dd>The effective breeding factor after those modifiers. Transfer Power is P raised to 0.7 / ln(1.45). It is not displayed damage or DPS. Calculate it separately for each parent.</dd>
        </dl>
        <div className={styles.formula} dangerouslySetInnerHTML={{ __html: ratioEquation }} />
        <p>Divide target power by source power. Direction matters: swapping parents reverses this ratio.</p>
        <div className={styles.formula} dangerouslySetInnerHTML={{ __html: normalEquation }} />
        <div className={styles.formula} dangerouslySetInnerHTML={{ __html: superEquation }} />
        <p>C is a percentage, so 25 means 25%. The base-1.45 logarithm can also be computed as ln(R) / ln(1.45). Inputs must be positive. Rank, level, enhancement, gear, mutations and account bonuses are excluded.</p>
        <p>These are research estimates. The evolution fit remains 2.1984×, except Gravitas uses its tested 2.2× modifier; small last-hundredth differences can still come from hidden base-stat precision. The calculator keeps full precision internally, then truncates the displayed Normal and Super percentages to two decimals to match observed in-game trait-rate displays.</p>
        <details><summary>Python implementation</summary><pre><code>{implementation}</code></pre></details>
    </section>;
}
