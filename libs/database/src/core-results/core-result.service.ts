import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CoreResult } from './core-result.entity';
import { CreateCoreResultDto } from './dto/create-core-result.dto';

@Injectable()
export class CoreResultService {
  constructor(
    @InjectRepository(CoreResult) private coreResult: Repository<CoreResult>,
  ) {}

  async findAll(): Promise<CoreResult[]> {
    const results = await this.coreResult.find();
    return results;
  }

  async findOne(id: number): Promise<CoreResult> {
    const result = await this.coreResult.findOne(id);
    return result;
  }

  async findResultsWithWebsite() {
    const result = await this.coreResult.find({
      relations: ['website'],
    });

    return result;
  }

  async create(createCoreResultDto: CreateCoreResultDto) {
    const result = await this.coreResult.findOne({
      finalUrl: createCoreResultDto.finalUrl,
    });

    if (result) {
      result.finalUrl = createCoreResultDto.finalUrl;
      result.finalUrlBaseDomain = createCoreResultDto.finalUrlBaseDomain;
      result.finalUrlIsLive = createCoreResultDto.finalUrlIsLive;
      result.targetUrlRedirects = createCoreResultDto.targetUrlRedirects;
      await this.coreResult.save(result);
    } else {
      const coreResult = new CoreResult();
      coreResult.website = createCoreResultDto.websiteId;
      coreResult.finalUrl = createCoreResultDto.finalUrl;
      coreResult.finalUrlIsLive = createCoreResultDto.finalUrlIsLive;
      coreResult.finalUrlBaseDomain = createCoreResultDto.finalUrlBaseDomain;
      coreResult.targetUrlRedirects = createCoreResultDto.targetUrlRedirects;
      await this.coreResult.save(coreResult);
    }
  }
}
