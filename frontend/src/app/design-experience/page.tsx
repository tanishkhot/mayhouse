'use client';

import React, { Suspense } from 'react';
import { DesignExperienceSkeleton } from '@/components/skeletons';
import DesignExperienceV2 from '@/components/design-experience-v2/DesignExperienceV2';

const DesignExperiencePage = () => {
  return (
    <Suspense fallback={<DesignExperienceSkeleton />}>
      <DesignExperienceV2 />
    </Suspense>
  );
};

export default DesignExperiencePage;