export function mockCommentsForMoment(momentId) {
  const now = Date.now();
  return [
    {
      id: `c-${momentId}-1`,
      author: "Maja",
      text: "Love the composition on the hero shot!",
      time: now - 1000 * 60 * 20,
      replies: [
        { id: `cr-${momentId}-1-1`, author: "Ožbej", text: "Thanks! It was golden hour ☀️", time: now - 1000 * 60 * 15 },
      ],
    },
    {
      id: `c-${momentId}-2`,
      author: "Dejan",
      text: "We should add these to the cover.",
      time: now - 1000 * 60 * 8,
      replies: [],
    },
  ];
}
