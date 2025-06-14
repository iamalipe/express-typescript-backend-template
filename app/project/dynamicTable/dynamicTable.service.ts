import { db } from '../../../services/db.services';
import { addChangeLogEntry } from '../../changeLog/changeLog.service';
import { IDynamicTable } from './dynamicTable.model';

export const createDynamicTable = async (
  data: Pick<
    IDynamicTable,
    'name' | 'description' | 'slug' | 'projectId' | 'fields'
  >,
) => {
  // unique check
  const uniqueCheck = await db.dynamicTable
    .findOne({
      slug: new RegExp(data.slug, 'i'),
      projectId: data.projectId,
    })
    .lean();

  if (uniqueCheck)
    throw new AppError('already exists', { status: 400, path: 'slug' });

  const createDoc = new db.dynamicTable({
    name: data.name,
    slug: data.slug,
    description: data.description,
    projectId: data.projectId,
    fields: data.fields,
  });
  const createSave = await createDoc.save();
  const createData = createSave.toObject();

  addChangeLogEntry({
    keys: ['name', 'slug', 'description', 'projectId', 'fields'],
    module: 'dynamicTable',
    title: `'${createData.name}' Dynamic Table Created`,
    newValue: createData,
    referenceId: createData?._id?.toString(),
    referenceModel: 'DynamicTable',
  });

  return createData;
};

export const updateDynamicTable = async (
  params: { id: string; projectId: string },
  data: Partial<Pick<IDynamicTable, 'name' | 'description' | 'fields'>>,
) => {
  const findResult = await db.dynamicTable
    .findOne({
      _id: params.id,
      projectId: params.projectId,
    })
    .lean();
  if (!findResult) throw new AppError('record not found', { status: 404 });

  const updateValues: Partial<IDynamicTable> = {};
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
  if (data.fields !== undefined) {
    updateValues['fields'] = data.fields;
    changeLogKeys.push('fields');
  }

  if (Object.keys(updateValues).length === 0)
    throw new AppError('no data to update', { status: 400 });

  const updatedResult = await db.dynamicTable.findByIdAndUpdate(
    params.id,
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
    module: 'dynamicTable',
    title: `'${updatedData.name}' Dynamic Table Updated`,
    newValue: updatedData,
    oldValue: findResult,
    referenceId: updatedData?._id?.toString(),
    referenceModel: 'DynamicTable',
  });

  return updatedData;
};
