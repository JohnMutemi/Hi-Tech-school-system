import { NextRequest, NextResponse } from 'next/server';

import { withGradingApiAccess } from '@/modules/grading-module/api/withGradingAccess';

import { getGradingStructure } from '@/modules/grading-module/services/structureService';

import {

  createAcademicYear,

  createAssessmentType,

  createGradingClass,

  createSubject,

  createTerm,

  listLegacyClasses,

} from '@/modules/grading-module/services/structureSetupService';



export async function GET(

  _request: NextRequest,

  { params }: { params: { schoolCode: string } }

) {

  const access = await withGradingApiAccess(params.schoolCode);

  if ('error' in access && access.error) return access.error;



  const data = await getGradingStructure(access.schoolContext.schoolId);

  const legacyClasses = await listLegacyClasses(access.schoolContext.schoolId);

  return NextResponse.json({ module: 'grading', data: { ...data, legacyClasses } });

}



export async function POST(

  request: NextRequest,

  { params }: { params: { schoolCode: string } }

) {

  const access = await withGradingApiAccess(params.schoolCode);

  if ('error' in access && access.error) return access.error;



  const body = await request.json();

  const entity = String(body.entity || '').trim();

  const schoolId = access.schoolContext.schoolId;



  try {

    let created: unknown;



    switch (entity) {

      case 'academicYear':

        if (!body.name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

        created = await createAcademicYear(schoolId, body);

        break;

      case 'term':

        if (!body.academicYearId || !body.name) {

          return NextResponse.json({ error: 'academicYearId and name are required' }, { status: 400 });

        }

        created = await createTerm(schoolId, body);

        break;

      case 'subject':

        if (!body.name || !body.code) {

          return NextResponse.json({ error: 'name and code are required' }, { status: 400 });

        }

        created = await createSubject(schoolId, body);

        break;

      case 'class':

        if (!body.name || !body.gradeLevel) {

          return NextResponse.json({ error: 'name and gradeLevel are required' }, { status: 400 });

        }

        created = await createGradingClass(schoolId, body);

        break;

      case 'assessmentType':

        if (!body.name || body.weight == null) {

          return NextResponse.json({ error: 'name and weight are required' }, { status: 400 });

        }

        created = await createAssessmentType(schoolId, {

          ...body,

          weight: Number(body.weight),

        });

        break;

      default:

        return NextResponse.json({ error: 'Unknown entity type' }, { status: 400 });

    }



    return NextResponse.json({ module: 'grading', success: true, data: created }, { status: 201 });

  } catch (error) {

    return NextResponse.json(

      { error: error instanceof Error ? error.message : 'Failed to create structure item' },

      { status: 400 }

    );

  }

}

