import { db } from '../../services/db.services';
import { addChangeLogEntry } from '../changeLog/changeLog.service';
import { IProject } from './project.model';

export const createProject = async (
  data: Pick<IProject, 'name' | 'description' | 'slug' | 'userId'>,
) => {
  // unique check
  const uniqueCheck = await db.project
    .findOne({
      slug: new RegExp(data.slug, 'i'),
    })
    .lean();

  if (uniqueCheck)
    throw new AppError('already exists', { status: 400, path: 'slug' });

  const createDoc = new db.project({
    name: data.name,
    slug: data.slug,
    description: data.description,
    userId: data.userId,
  });
  const createSave = await createDoc.save();
  const createData = createSave.toObject();

  addChangeLogEntry({
    keys: ['name', 'slug', 'description'],
    module: 'project',
    title: `'${createData.name}' Project Created`,
    newValue: createData,
    referenceId: createData?._id?.toString(),
    referenceModel: 'Project',
  });

  return createData;
};

export const updateProject = async (
  id: string,
  data: Partial<Pick<IProject, 'name' | 'description'>>,
) => {
  const findResult = await db.project.findById(id).lean();
  if (!findResult) throw new AppError('record not found', { status: 404 });

  const updateValues: Partial<IProject> = {};
  const changeLogKeys: string[] = [];
  if (data.name !== undefined && data.name !== findResult.name) {
    updateValues['name'] = data.name;
    changeLogKeys.push('name');
  }

  if (
    data.description !== undefined &&
    data.description !== findResult.description
  ) {
    updateValues['description'] = data.description;
    changeLogKeys.push('description');
  }

  if (Object.keys(updateValues).length === 0)
    throw new AppError('no data to update', { status: 400 });

  const updatedResult = await db.project.findByIdAndUpdate(
    id,
    {
      $set: updateValues,
    },
    {
      new: true,
    },
  );

  if (!updatedResult) throw new AppError('record not found', { status: 404 });
  const updatedData = updatedResult.toObject();

  addChangeLogEntry({
    keys: changeLogKeys,
    module: 'project',
    title: `'${updatedData.name}' Project Updated`,
    newValue: updatedData,
    oldValue: findResult,
    referenceId: updatedData?._id?.toString(),
    referenceModel: 'Project',
  });

  return updatedData;
};

export const getAllProject = async (filter?: any) => {
  const findAllResult = await db.project.find(filter);

  return findAllResult;
};

export const getProject = async (id: string) => {
  const findResult = await db.project.findById(id);

  return findResult;
};

export const deleteProject = async (id: string) => {
  const findResult = await db.project.findById(id).lean();
  if (!findResult) throw new AppError('record not found', { status: 404 });

  const deleteResult = await db.project.deleteOne({ _id: id });

  if (deleteResult.acknowledged === false)
    throw new AppError('record not found', { status: 404 });
  if (deleteResult.deletedCount === 0)
    throw new AppError('record not found', { status: 404 });

  addChangeLogEntry({
    keys: ['name', 'slug', 'description'],
    module: 'project',
    title: `'${findResult.name}' Project Deleted`,
    newValue: findResult,
    referenceId: findResult?._id?.toString(),
    referenceModel: 'Project',
  });

  return findResult;
};
