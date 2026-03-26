export async function getServerSideProps() {
  return {
    redirect: {
      destination: '/practice-sheets/kanji',
      permanent: true,
    },
  };
}

export default function KanjiPracticeRedirect() {
  return null;
}
