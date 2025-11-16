'use client';

import React, { Suspense } from 'react';
import { HostOnlyRoute } from '@/components/ProtectedRoute';
import { DesignExperienceSkeleton } from '@/components/skeletons';
import DesignExperienceV2 from '@/components/design-experience-v2/DesignExperienceV2';

const DesignExperiencePage = () => {
  return (
    <HostOnlyRoute skeleton={<DesignExperienceSkeleton />}> 
      <Suspense fallback={<DesignExperienceSkeleton />}> 
        <DesignExperienceV2 />
      </Suspense>
    </HostOnlyRoute>
  );
};

export default DesignExperiencePage;