import { useLocalSearchParams } from 'expo-router';

import { SignInScreen } from '@/shell/screens/SignInScreen';

export default function SignInRoute() {
  const { notice } = useLocalSearchParams<{ notice?: string }>();
  return <SignInScreen initialNotice={notice} />;
}
