import { db } from '../../services/db.services';
import { databaseResponseTimeHistogram } from '../../utils/metrics.utils';
import { addChangeLogEntry } from '../changeLog/changeLog.service';
import { ICopyMe } from './copyMe.model';

export const createCopyMe = async (
  data: Pick<ICopyMe, 'name' | 'description' | 'userId'>,
) => {
  const dbHistogram01 = databaseResponseTimeHistogram.startTimer();
  // unique check
  const uniqueCheck = await db.copyMe
    .findOne({
      name: new RegExp(data.name, 'i'),
    })
    .lean();
  dbHistogram01({ operation: 'findCopyMe', success: 'true' });

  if (uniqueCheck)
    throw new AppError('already exists', { status: 400, path: 'name' });

  const dbHistogram02 = databaseResponseTimeHistogram.startTimer();
  const createDoc = new db.copyMe({
    name: data.name,
    description: data.description,
    userId: data.userId,
  });
  const createSave = await createDoc.save();
  dbHistogram02({ operation: 'createCopyMe', success: 'true' });
  const createData = createSave.toObject();

  addChangeLogEntry({
    keys: ['name', 'description'],
    module: 'copyMe',
    title: `'${createData.name}' CopyMe Created`,
    newValue: createData,
    referenceId: createData.id,
  });

  return createData;
};

export const updateCopyMe = async (
  id: string,
  data: Partial<Pick<ICopyMe, 'name' | 'description'>>,
) => {
  const dbHistogram01 = databaseResponseTimeHistogram.startTimer();
  const findResult = await db.copyMe.findById(id).lean();
  dbHistogram01({ operation: 'findCopyMe', success: 'true' });
  if (!findResult) throw new AppError('record not found', { status: 404 });

  const updateValues: Partial<ICopyMe> = {};
  const changeLogKeys: string[] = [];
  if (data.name !== undefined && data.name !== findResult.name) {
    const dbHistogram02 = databaseResponseTimeHistogram.startTimer();
    const uniqueCheck = await db.copyMe
      .findOne({
        name: new RegExp(data.name, 'i'),
      })
      .lean();
    dbHistogram02({ operation: 'findCopyMe', success: 'true' });

    if (uniqueCheck)
      throw new AppError('already exists', { status: 400, path: 'name' });

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

  const dbHistogram03 = databaseResponseTimeHistogram.startTimer();
  const updatedResult = await db.copyMe.findByIdAndUpdate(
    id,
    {
      $set: updateValues,
    },
    {
      new: true,
    },
  );
  dbHistogram03({ operation: 'updateCopyMe', success: 'true' });

  if (!updatedResult) throw new AppError('record not found', { status: 404 });
  const updatedData = updatedResult.toObject();

  addChangeLogEntry({
    keys: changeLogKeys,
    module: 'copyMe',
    title: `'${updatedData.name}' CopyMe Updated`,
    newValue: updatedData,
    oldValue: findResult,
    referenceId: updatedData.id,
  });

  return updatedData;
};
