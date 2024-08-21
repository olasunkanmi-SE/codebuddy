import { formatText } from "../utils";
import { EventGenerator } from "./event-generator";
import * as vscode from "vscode";

export class GenerateUnitTest extends EventGenerator {
  constructor(action: string, context: vscode.ExtensionContext) {
    super(action, context);
  }

  generatePrompt(selectedCode: string) {
    const PROMPT = `
     This is a Sample unit test
      describe('Order Service', () => {
      let orderService: OrderService;
      let configService: jest.Mocked<ConfigService>;
      let redisCacheServiceMock: jest.Mocked<IRedisService>;
      let excelGeneratorServiceMock: jest.Mocked<IOrderExcelGeneratorService>;
      let s3ServiceMock: jest.Mocked<IS3Service>;
      let loggerMock: jest.Mocked<IContextAwareLogger>;

      beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
          providers: [
            OrderService,
            {
              provide: ConfigService,
              useValue: {
                get: jest.fn((key: string) => {
                  const config = {
                    COIN_STORE_URL: 'https://api.coinstore.com',
                    COIN_STORE_SECRET_KEY: 'mock-secret-key',
                    COIN_STORE_API_KEY: 'mock-api-key',
                  };
                  return config[key];
                }),
              },
            },
            {
              provide: TYPES.HttpClient,
              useValue: {
                get: jest.fn(),
                post: jest.fn(),
              },
            },
            {
              provide: TYPES.applicationLogger,
              useValue: {
                log: jest.fn(),
                error: jest.fn(),
                warn: jest.fn(),
                debug: jest.fn(),
              },
            },
            {
              provide: TYPES.RedisCacheService,
              useValue: {
                get: jest.fn(),
                set: jest.fn(),
              },
            },
            {
              provide: TYPES.OrderExcelGeneratorService,
              useValue: {
                generateOrderExcelFile: jest.fn(),
              },
            },
            {
              provide: TYPES.S3Service,
              useValue: {
                addObjectToS3: jest.fn(),
                getS3Url: jest.fn(),
              },
            },
            {
              provide: TYPES.CoinStoreTransactionRepository,
              useValue: {
                findOne: jest.fn(),
                saveBulkTransactions: jest.fn(),
                getTransactionListWithPagination: jest.fn(),
              },
            },
          ],
        }).compile();

        orderService = module.get<OrderService>(OrderService);
        configService = module.get(ConfigService);
        redisCacheServiceMock = module.get(TYPES.RedisCacheService);
        s3ServiceMock = module.get(TYPES.S3Service);
        excelGeneratorServiceMock = module.get(TYPES.OrderExcelGeneratorService);
        loggerMock = module.get(TYPES.applicationLogger);
      });

      it('should be defined', () => {
        expect(orderService).toBeDefined();
      });

      it('should initialize with correct configuration', () => {
        expect(configService.get).toHaveBeenCalledWith('COIN_STORE_URL');
        expect(configService.get).toHaveBeenCalledWith('COIN_STORE_SECRET_KEY');
        expect(configService.get).toHaveBeenCalledWith('COIN_STORE_API_KEY');
      });

      describe('fetchOrders', () => {
        it('should return cached orders if available', async () => {
          const mockFilters = { pageNum: 1, pageSize: 10 };
          const mockCachedData = [{ id: 1, ordPrice: 100, quoteCurrency: 'USD' }];
          redisCacheServiceMock.get.mockResolvedValue(mockCachedData);
          const result = await orderService.fetchOrders(mockFilters);
          expect(result).toBeDefined();
          expect(result.data).toHaveLength(1);
          expect(result.data[0].ordPriceWithCurrency).toBe('100 USD');
          expect(redisCacheServiceMock.get).toHaveBeenCalledWith('orders:all');
        });

        it('should fetch orders from API if cache is empty', async () => {
          const mockFilters = { pageNum: 1, pageSize: 10 };
          redisCacheServiceMock.get.mockResolvedValue(null);
          const mockApiResponse = {
            data: [{ id: 1, ordPrice: 100, quoteCurrency: 'USD' }],
          };
          jest
            .spyOn(orderService as any, 'requestData')
            .mockResolvedValue(mockApiResponse);

          const result = await orderService.fetchOrders(mockFilters);

          expect(result).toBeDefined();
          expect(result.data).toHaveLength(1);
          expect(result.data[0].ordPriceWithCurrency).toBe('100 USD');
          expect(redisCacheServiceMock.set).toHaveBeenCalled();
        });

        it('should throw an error if no orders are found', async () => {
          const mockFilters = { pageNum: 1, pageSize: 10 };
          redisCacheServiceMock.get.mockResolvedValue(null);
          jest
            .spyOn(orderService as any, 'requestData')
            .mockResolvedValue({ data: [] });
          let result;
          try {
            result = await orderService.fetchOrders(mockFilters);
          } catch (error) {
            expect(error.errorMessage).toBe('There are no orders placed yet');
            expect(result).toBeUndefined;
          }
        });
      });
    });


    for this method

    export class OrderService extends CoinStoreService implements IOrderService {
      protected data: ITrade[];
      constructor(
        configService: ConfigService,
        httpClient: IHttpClient,
        logger: IContextAwareLogger,
        @Inject(TYPES.RedisCacheService)
        private readonly _redisCacheService: IRedisService,
        @Inject(TYPES.OrderExcelGeneratorService)
        private readonly _excelGeneratorService: IOrderExcelGeneratorService,
        @Inject(TYPES.S3Service)
        private readonly _s3Service: IS3Service,
        @Inject(TYPES.CoinStoreTransactionRepository)
        private readonly coinStoreTransactionRepository: ICoinStoreTransactionRepository,
      ) {
        super(configService, httpClient, logger);
      }

      async fetchOrders(filters: IOrdersFilters): Promise<IPaginationResponse> {
        try {
          const cacheKey: string = orders:all;
          let cachedData = (await this._redisCacheService.get(
            cacheKey,
          )) as ITrade[];
          if (cachedData) {
            cachedData = this._mapOrdersData(cachedData);
            return pagination(cachedData, filters, 'OrderPaginatedResponse');
          }
          const payload: Buffer = Buffer.from('');
          const orders: IOrderResponse = await this.requestData(
            HTTP_VERBS.get,
            API_URLS.coinStore.getOrders,
            payload,
          );
          if (!orders?.data?.length) {
            throw applicationError('There are no orders placed yet', {
              statusCode: 400,
            });
          }
          this.data = orders.data;
          orders.data = this._mapOrdersData(orders.data);
          await this._cacheResponse(orders.data, cacheKey);
          return pagination(orders.data, filters, 'OrderPaginatedResponse');
        } catch (error) {
          handleError(error, this.logger);
        }
      }
      Write tests for each method/function of the provided code block
      Test successful executions with valid inputs and expected outputs
      Test error handling for invalid inputs, edge cases, and unexpected errors
      Use mock implementations for dependencies, if applicable
      Use descriptive test names and assertions to ensure clarity and readability
      Generate unit test on this Code Block: ${selectedCode} based on the sample unit test.
      Output: Generate a set of unit tests that meet the requirements above. 
      The output should be a test file with multiple test suites, each covering a specific method/function of the provided code block. 
      The tests should be written in selected code language and use [Jest, Mocha, etc.]'s API for assertions and mocking.
      Note: Please ensure that the generated tests are well-structured, readable, and maintainable. Also, provide explanations and justifications for the generated tests to help understand the reasoning behind the test cases.
`;
    return PROMPT;
  }

  formatResponse(comment: string): string {
    return formatText(comment);
  }

  createPrompt(selectedCode: string): string {
    const prompt = this.generatePrompt(selectedCode);
    return prompt;
  }
}
