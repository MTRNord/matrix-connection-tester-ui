import type { CardData } from "./types";

/**
 * Recursively flattens a tree of cards into an array.
 * Used for measuring positions and rendering arrows.
 */
export function flattenCards(card: CardData): CardData[] {
    const arr: CardData[] = [card];
    if (card.children) {
        for (const child of card.children) {
            arr.push(...flattenCards(child));
        }
    }
    return arr;
}
