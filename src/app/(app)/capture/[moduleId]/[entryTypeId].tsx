import { useLocalSearchParams } from 'expo-router';

import { CaptureScreen } from '@/shell/screens/CaptureScreen';

/** The capture form for any module's entry type (task 5.2 routes here). */
export default function CaptureRoute() {
  const { moduleId, entryTypeId } = useLocalSearchParams<{
    moduleId: string;
    entryTypeId: string;
  }>();
  return <CaptureScreen moduleId={moduleId} entryTypeId={entryTypeId} />;
}
