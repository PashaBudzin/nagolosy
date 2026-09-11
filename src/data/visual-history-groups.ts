export interface VisualHistoryGroup {
  id: string
  name: string
  itemIndices: number[]
}

export const VISUAL_HISTORY_GROUPS: VisualHistoryGroup[] = [
  { id: "hromads-ko-politychni-ta-viis-kovi-diiachi", name: "Громадсько-політичні та військові діячі", itemIndices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] },
  { id: "diiachi-kul-tury-osvity-ta-nauky", name: "Діячі культури, освіти та науки", itemIndices: [14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29] },
  { id: "arkhitektura-kul-tovykh-sporud-v-ukrayini", name: "Архітектура культових споруд в Україні", itemIndices: [30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52] },
  { id: "arkhitektura-fortyfikatsiinykh-sporud-v-ukrayini", name: "Архітектура фортифікаційних споруд в Україні", itemIndices: [53, 54, 55, 56] },
  { id: "svits-ka-arkhitektura-mistobuduvannia", name: "Світська архітектура. Містобудування", itemIndices: [57, 58, 59, 60, 61, 62, 63, 64, 65] },
  { id: "skul-ptura-pam-iatnyky", name: "Скульптура. Пам'ятники", itemIndices: [66, 67, 68, 69, 70, 71] },
  { id: "ikony-obrazotvorche-mystetstvo", name: "Ікони (Образотворче мистецтво)", itemIndices: [72, 73, 74, 75, 76, 77, 78, 79, 80] },
  { id: "miniatiury-hraviury-portrety", name: "Мініатюри. Гравюри. Портрети", itemIndices: [81, 82, 83, 84, 85, 86, 87, 88] },
  { id: "khudozhni-roboty-obrazotvorche-mystetstvo", name: "Художні роботи (Образотворче мистецтво)", itemIndices: [89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102] },
  { id: "pam-iatky-starodavn-oyi-istoriyi-ukrayiny", name: "Пам'ятки стародавньої історії України", itemIndices: [103, 104, 105, 106, 107] },
]