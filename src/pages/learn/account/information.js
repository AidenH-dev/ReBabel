// Redirect to new location
export async function getServerSideProps() {
  return {
    redirect: {
      destination: '/learn/academy/resources',
      permanent: true,
    },
  };
}

export default function Information() {
  return null;
}
